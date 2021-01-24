// TODO: how to import?

// import {
//   getDelta, formatDelta, aggregateDeltas,formatDate, formatTime
// } from '../public/scripts/time.js';

// import {
//   getTimelog, updateTimelog, deleteTimelog
// } from '../public/scripts/timelog.js';

const log = console.log;

// copy paste
function zeroPad(num) {
  return num < 10 ? `0${num}` : num;
}

function getDelta(start, end) {
  let delta = Math.abs(start - end) / 1000;

  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;
  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;
  const seconds = Math.floor(delta % 60);

  return [hours, minutes, seconds];
}

function aggregateDeltas(deltas) {
  let a = deltas.reduce((acc, e) => {
    return [acc[0] + e[0], acc[1] + e[1], acc[2] + e[2]]; 
  });

  if (a[2] > 60) {
    a[1] += Math.floor(a[2] / 60);
    a[2] = a[2] % 60;
  }

  if (a[1] > 60) {
    a[0] += Math.floor(a[1] / 60);
    a[1] = a[1] % 60;
  }

  return a;
}

function formatDelta(delta) {
  const [hours, minutes, seconds] = delta;
  return (hours === 0) ?
    `${minutes}m ${zeroPad(seconds)}s` :
    `${hours}h ${zeroPad(minutes)}m ${zeroPad(seconds)}s`;
}

// TESTING
(() => {
  // let here = new Date();
  // log(`Here: ${here.toString()}`);
  // let d0 = getDate(here), d1 = getTime(here);
  // log(d0, d1);

  // const timezones = ['America/Toronto', 'Europe/Helsinki', 'Asia/Bangkok'];
  // timezones.forEach(t => {
  //   let there = changeTimezone(here, t);
  //   log(`${t} : ${there.toString()}`);
  //   let d0 = getDate(here), d1 = getTime(here);
  //   log(d0, d1);
  // });

  // 3h 52m 28s
  let now = new Date(2020, 1, 1, 3, 52, 28, 0);
  let then = new Date(2019, 1, 1, 0, 0, 0, 0);
  const delta1 = getDelta(now, then);
  log(delta1);
  log(formatDelta(delta1));

  // 8h 37m 46s
  now = new Date(2020, 1, 1, 8, 37, 46, 0);
  then = new Date(2019, 1, 1, 0, 0, 0, 0);
  const delta2 = getDelta(now, then);
  log(delta2);
  log(formatDelta(delta2));

  // 9h 43m 59s
  now = new Date(2020, 1, 1, 9, 43, 59, 0);
  then = new Date(2019, 1, 1, 0, 0, 0, 0);
  const delta3 = getDelta(now, then);
  log(delta3);
  log(formatDelta(delta3));

  // 20h, 132m, 133s
  // 22h, 14m, 13s
  const ad = [delta1, delta2, delta3]
  log(aggregateDeltas(ad));
  log(formatDelta(aggregateDeltas(ad)));
})();