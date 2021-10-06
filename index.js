const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const log = console.log;
const port = process.env.port || 3000;
const timelogPath = path.join(__dirname, 'timelog.json');

function getTimelog() {
  // create an empty timelog, if no file exists
  if (!fs.existsSync(timelogPath)) {
    fs.writeFileSync(timelogPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(timelogPath));
}

// routes
app.get('/', (_, res) => {
  res.render('index');
});

app.get('/timelog', (_, res) => {
  res.json(getTimelog());
});

/*
data format:
{
  action: ADD/DEL
  date: <Date>,
  interval: [start <Date>, end <Date>]
}
*/ 
const allowedActions = ['ADD', 'DEL'];
app.post('/timelog', (req, res) => {
  const {action, date, interval} = req.body;

  if (!allowedActions.includes(action)) {
    res.json(timelog);
  }

  const timelog = getTimelog();

  // delete the specific interval, if it exists
  if (action === 'DEL') {
    for (const i in timelog[date]) {
      if (timelog[date][i][0] === interval[0] &&
          timelog[date][i][1] === interval[1]) {
        timelog[date].splice(i, 1);
        if (timelog[date].length === 0) {
          delete timelog[date];
        }
        fs.writeFileSync(timelogPath, JSON.stringify(timelog, null, 4));
      }
    }
    res.json(timelog);
  } else if (action === 'ADD') {
    let addToTimelog = false;
    // case: no intervals exist for this day
    if (!(date in timelog)) {
      timelog[date] = [interval];
      addToTimelog = true;
    // invariant: at least one interval exists for the given day
    } else {
      // convert timestamps to date objects for comparison
      const intervals = timelog[date].map(x => [new Date(x[0]), new Date(x[1])]);
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
    }
    res.json(timelog);
  }
});

app.delete('/timelog', (_, res) => {
  fs.writeFileSync(timelogPath, JSON.stringify({}));
  res.json({});
});

app.listen(port, () => {
  log(`be productive => http://127.0.0.1:${port}`);
});