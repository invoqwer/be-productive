import fs from 'fs';
import http from 'http';
import path from 'path';

// index.js should always be run from "npm run start"
// can also run from the top level dir: "node server/index.js"
const __root = path.resolve();
const publicFolder = path.join(__root, 'client');
const timelogPath = path.join(__root, 'server', 'timelog.json');

// const log = console.log;
const port = 3000;

const getTimelog = () => {
  // create an empty timelog, if no file exists
  if (!fs.existsSync(timelogPath)) {
    fs.writeFileSync(timelogPath, JSON.stringify({}));
  }

  const timelog = JSON.parse(fs.readFileSync(timelogPath));

  // ordered by key => increasing date
  const ordered = Object.keys(timelog).sort().reduce(
      (obj, key) => {
        obj[key] = timelog[key];
        return obj;
      },
      {},
  );

  return ordered;
};

const deleteTimelog = () => {
  fs.writeFileSync(timelogPath, JSON.stringify({}));
  return {};
};

const getHandler = (req, res) => {
  switch (req.url) {
    case '/timelog':
      res.writeHead(200, {'Content-type': 'application/json'});
      return res.end(JSON.stringify(getTimelog()));
    default: {
      // serving a public resource
      const filePath = (req.url === '/') ?
        path.join(publicFolder, 'index.html') :
        path.join(publicFolder, req.url);
      let contentType = 'text/html';
      switch (path.extname(req.url)) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
      }

      fs.readFile(filePath, function(err, data) {
        if (err) {
          res.writeHead(404, {'Content-Type': contentType});
          res.write('404: Not Found');
        } else {
          res.writeHead(200, {'Content-Type': contentType});
          res.write(data);
        }
        return res.end();
      });
    }
  }
};

/*
data format:
{
  action: ADD/DEL
  date: <Date>,
  interval: [start <Date>, end <Date>]
}
*/
const handleTimelogPost = async (req, res) => {
  const contentTypeHeader = {'Content-Type': 'application/json'};
  const allowedActions = ['ADD', 'DEL'];
  const timelog = getTimelog();
  // read request body
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const body = Buffer.concat(buffers).toString();
  const {action, date, interval} = JSON.parse(body);
  const errMsg = `Bad ${action} interval request`;

  if (!allowedActions.includes(action)) {
    res.writeHead(200, contentTypeHeader);
    return res.end(JSON.stringify(timelog));
  }

  // delete the specific interval, if it exists
  if (action === 'DEL') {
    let deleteInterval = false;
    for (const i in timelog[date]) {
      if (timelog[date][i][0] === interval[0] &&
          timelog[date][i][1] === interval[1]) {
        timelog[date].splice(i, 1);
        if (timelog[date].length === 0) {
          delete timelog[date];
        }
        deleteInterval = true;
        break;
      }
    }
    if (deleteInterval === true) {
      fs.writeFileSync(timelogPath, JSON.stringify(timelog, null, 4));
      res.writeHead(200, contentTypeHeader);
      return res.end(JSON.stringify(timelog));
    } else {
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.write(errMsg);
      return res.end();
    }
  } else if (action === 'ADD') {
    let addToTimelog = false;
    // case: no intervals exist for this day
    if (!(date in timelog)) {
      timelog[date] = [interval];
      addToTimelog = true;
    // invariant: at least one interval exists for the given day
    } else {
      // convert timestamps to date objects for comparison
      const intervals = timelog[date].map((x) =>
        [new Date(x[0]), new Date(x[1])]);
      const [start, end] = [new Date(interval[0]), new Date(interval[1])];
      // validate interval before appending
      for (let i = 0; i < intervals.length; i++) {
        // consider: [... [a, b], [c, d], [e, f] ...] - we are adding [c, d]
        // ensure: c < d
        if (start >= end) {
          break;
        }
        // find where to insert interval
        // case: inserting interval at the head
        if (i == 0 &&
          end <= intervals[i][0]) {
          timelog[date].unshift(interval);
          addToTimelog = true;
          break;
        // case: inserting interval at the tail
        } else if (i == intervals.length - 1 &&
          start >= intervals[i][1]) {
          timelog[date].push(interval);
          addToTimelog = true;
          break;
        // Regular insertion. ensure: b <= c && d <= e
        } else if (i > 0 && i < intervals.length &&
          start >= intervals[i-1][1] &&
          end <= intervals[i][0]) {
          timelog[date].splice(i, 0, interval);
          addToTimelog = true;
          break;
        }
      }
    }
    if (addToTimelog === true) {
      fs.writeFileSync(timelogPath, JSON.stringify(timelog, null, 4));
      res.writeHead(200, contentTypeHeader);
      return res.end(JSON.stringify(timelog));
    } else {
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.write(errMsg);
      return res.end();
    }
  }
};

const postHandler = async (req, res) => {
  switch (req.url) {
    case '/timelog':
      return handleTimelogPost(req, res);
  }
};

const deleteHandler = (req, res) => {
  switch (req.url) {
    case '/timelog':
      res.writeHead(200, {'Content-type': 'application/json'});
      return res.end(JSON.stringify(deleteTimelog()));
  }
};

const server = http.createServer(async (req, res) => {
  switch (req.method) {
    case 'GET': return getHandler(req, res);
    case 'POST': return postHandler(req, res);
    case 'DELETE': return deleteHandler(req, res);
  }
});

server.listen(port);
