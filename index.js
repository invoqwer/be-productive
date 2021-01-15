const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
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

app.get('/', (_, res) => {
  res.render('index');
});

app.get('/timelog', (_, res) => {
  res.json(getTimelog());
});

app.post('/timelog', (req, res) => {
  const {date, interval} = req.body;
  const timelog = getTimelog();
  if (!(date in timelog)) {
    timelog[date] = [interval];
  } else {
    timelog[date].push(interval);
  }
  fs.writeFileSync(timelogPath, JSON.stringify(timelog, null, 4));
  res.json(timelog);
});

app.delete('/timelog', (_, res) => {
  fs.writeFileSync(timelogPath, JSON.stringify({}));
  res.json({});
});

app.listen(port, () => {
  log(`be productive => http://127.0.0.1:${port}`);
});