const log = console.log;

function formatDelta(delta) {
  const [hours, minutes, seconds] = delta;
  return (hours === 0) ?
    `${minutes}m ${zeroPad(seconds)}s` :
    `${hours}h ${zeroPad(minutes)}m ${zeroPad(seconds)}s`;
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

function formatMonth(month) {
  switch(month) {
    case 0: return 'Jan'; break; 
    case 1: return 'Feb'; break;
    case 2: return 'Mar'; break;
    case 3: return 'Apr'; break;
    case 4: return 'May'; break;
    case 5: return 'Jun'; break;
    case 6: return 'Jul'; break;
    case 7: return 'Aug'; break;
    case 8: return 'Sep'; break;
    case 9: return 'Oct'; break;
    case 10: return 'Nov'; break;
    case 11: return 'Dec'; break;
  }
}

function formatWeekday(day) {
  switch(day) {
    case 0: return 'Sun'; break;
    case 1: return 'Mon'; break; 
    case 2: return 'Tue'; break;
    case 3: return 'Wed'; break;
    case 4: return 'Thu'; break;
    case 5: return 'Fri'; break;
    case 6: return 'Sat'; break;
  }
}

// zero pad to 2 digits
function zeroPad(num) {
  return num < 10 ? `0${num}` : num;
}

// convert 24 hours to 12 hours
function convertHours(hours) {
  return {
    num: +hours % 12 || 12,
    meridiem: +hours < 12 ? 'AM' : 'PM'
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = formatMonth(date.getMonth());
  const day = date.getDate();
  const weekday = formatWeekday(date.getDay());
  return `${weekday} ${month}.${day} ${year}`;
}

function formatTime(date, includeSeconds = false) {
  const hours = convertHours(date.getHours());
  const minutes = zeroPad(date.getMinutes());
  const seconds = zeroPad(date.getSeconds());

  return (includeSeconds === true) ? 
    `${hours.num}:${minutes}:${seconds} ${hours.meridiem}` :
    `${hours.num}:${minutes} ${hours.meridiem}`;
}

function changeTimezone(date, ianatz) {
  var invdate = new Date(
    date.toLocaleString(
      'en-US',
      { timeZone: ianatz }
    )
  );
  var diff = date.getTime() - invdate.getTime();
  return new Date(date.getTime() - diff); // needs to substract
}

// DATA
function getTimelog() {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest(); 
    xhr.open('GET', '/timelog', true); 
    xhr.onload = () => { 
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(xhr);
      } else {
        resolve(JSON.parse(xhr.response));
      }
    }; 
    xhr.send(); 
  });
}

function updateTimelog(data) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest(); 
    xhr.open('POST', '/timelog', true); 
    xhr.setRequestHeader('Content-Type', 'application/json'); 
    xhr.onload = () => { 
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(xhr);
      } else {
        resolve(JSON.parse(xhr.response));
      }
    }; 
    xhr.send(JSON.stringify(data)); 
  });
}

function deleteTimelog() {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest(); 
    xhr.open('DELETE', '/timelog', true); 
    xhr.onload = () => { 
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(xhr);
      } else {
        resolve(JSON.parse(xhr.response));
      }
    }; 
    xhr.send(null); 
  });
}

// { "date": [ [start,end], [start,end] ... ], ... }
function populateFromJSON(data) {
  const tl = document.getElementById('timelog-wrapper');
  tl.innerHTML = '';

  for (const [date, intervals] of Object.entries(data)) {
    let day = document.createElement('div');
    day.classList.add('day');
    
    let dayHeader = document.createElement('div');
    dayHeader.classList.add('logHeader');
    dayHeader.innerText = date;
    day.appendChild(dayHeader);

    intervals.forEach(interval => {
      const [start, end, delta] = interval;
      let left = document.createElement('div');
      let middle = document.createElement('div');
      let right = document.createElement('div');
      right.classList.add('accent');
      left.innerText = formatTime(new Date(start), true);
      middle.innerText = formatTime(new Date(end), true);
      right.innerText = formatDelta(delta);

      let entry = document.createElement('div');
      entry.classList.add('log-entry');
      entry.appendChild(left);
      entry.appendChild(middle);
      entry.appendChild(right);

      day.appendChild(entry);
    });

    let aggregate = document.createElement('div');
    aggregate.classList.add('logHeader', 'aggregate');

    const deltas = intervals.map(i => { return i[2]; });
    aggregate.innerText = `Total: ${formatDelta(aggregateDeltas(deltas))}`;
    day.appendChild(aggregate);

    tl.appendChild(day);
  }
}
getTimelog().then(res => {
  populateFromJSON(res);
});

function addInterval(interval) {
  log('Adding interval:');
  log(interval);
  updateTimelog(interval).then(res => {
    populateFromJSON(res);
  });
}

function clearTimelog() {
  log('Clearing timelog');
  deleteTimelog().then(res => {
    populateFromJSON(res);
  })
}

// [ [start,end,aggregate], ... ]
function aggregateDeltas(intervals) {
  return intervals.reduce((acc, e) => {
    return [acc[0] + e[0], acc[1] + e[1], acc[2] + e[2]]; 
  });
}

function parseLocalStorage() {
  let start = storage.getItem('start');
  let isRecording = storage.getItem('isRecording');
  start = start ? new Date(start) : null;
  isRecording = (isRecording === 'true') ? true : false;
  return [start, isRecording];
}

// CONTROLLER
const storage = window.localStorage;
let now, delta;
let [start, isRecording] = parseLocalStorage();

function updateView() {
  now = new Date();
  const date = formatDate(now);
  const time = formatTime(now);

  document.getElementById('date').innerText = date;
  document.getElementById('time').innerText = time;
  
  if (isRecording) {
    delta = getDelta(start, now);
    document.getElementById('start-time').innerHTML = formatTime(start);
    document.getElementById('current-time').innerHTML = formatDelta(delta);
  }
}
setInterval(updateView, 1000);

function startRecording() {
  if (!isRecording && now) {
    log('Start recording');
    isRecording = true, start = now;
    storage.setItem('isRecording', true);
    storage.setItem('start', now);
  }
}

function cancelRecording() {
  if (isRecording) {
    log('Cancel recording');

    document.getElementById('start-time').innerHTML = '';
    document.getElementById('current-time').innerHTML = '';
    isRecording = false, start = null;
    storage.setItem('isRecording', false);
    storage.setItem('start', null);
  }
}

function endRecording() {
  if (isRecording && start && now && delta) {
    log('End recording');

    addInterval({
      date: formatDate(now),
      interval: [start, now, delta]
    });

    document.getElementById('start-time').innerHTML = '';
    document.getElementById('current-time').innerHTML = '';
    isRecording = false, start = null;
    storage.setItem('isRecording', false);
    storage.setItem('start', null);
  }
}

document.addEventListener('keypress', handleKeypress);
function handleKeypress(e) {
  switch(e.keyCode) {
    // space - start
    case 32: startRecording(); break;
    // c - cancel 
    case 99: cancelRecording(); break;
    // enter - end      
    case 13: endRecording(); break;      
  }
}

// TESTING
const test = () => {
  let here = new Date();
  log(`Here: ${here.toString()}`);
  let d0 = getDate(here), d1 = getTime(here);
  log(d0, d1);

  const timezones = ['America/Toronto', 'Europe/Helsinki', 'Asia/Bangkok'];
  timezones.forEach(t => {
    let there = changeTimezone(here, t);
    log(`${t} : ${there.toString()}`);
    let d0 = getDate(here), d1 = getTime(here);
    log(d0, d1);
  });
}
// test();