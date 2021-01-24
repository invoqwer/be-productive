import {
  getDelta, formatDelta, aggregateDeltas,formatDate, formatTime
} from './time.js';

import {
  getTimelog, updateTimelog, deleteTimelog
} from './timelog.js';

const log = console.log;

// Update Views via AJAX Requests
getTimelog().then(res => {
  populateTimelog(res);
});

function addIntervalToTimelog(interval) {
  log('Adding interval:');
  log(interval);
  updateTimelog(interval).then(res => {
    populateTimelog(res);
  });
}

function clearTimelog() {
  log('Clearing timelog');
  deleteTimelog().then(res => {
    populateTimelog(res);
  })
}

// Populate Timelog from JSON
// { "date": [ [start,end], [start,end] ... ], ... }
function populateTimelog(data) {
  const tl = document.getElementById('timelog-wrapper');
  tl.innerHTML = '';

  for (const [date, intervals] of Object.entries(data)) {
    let day = document.createElement('div');
    day.classList.add('day');
    
    let dayHeader = document.createElement('div');
    dayHeader.classList.add('logHeader');
    dayHeader.innerText = date;
    day.appendChild(dayHeader);

    let deltas = [];

    intervals.forEach(interval => {
      const start = new Date(interval[0]);
      const end = new Date(interval[1]);
      const delta = getDelta(start, end);
      deltas.push(delta);

      let left = document.createElement('div');
      let middle = document.createElement('div');
      let right = document.createElement('div');
      right.classList.add('accent');

      left.innerText = formatTime(start, true);
      middle.innerText = formatTime(end, true);
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

    aggregate.innerText = `Total: ${
      formatDelta(aggregateDeltas(deltas))
    }`;
    day.appendChild(aggregate);

    tl.appendChild(day);
  }
}

// Update Time + Local Storage
function parseLocalStorage() {
  let start = storage.getItem('start');
  let isRecording = storage.getItem('isRecording');
  start = start ? new Date(start) : null;
  isRecording = (isRecording === 'true') ? true : false;
  return [start, isRecording];
}

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

// Recording
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
  if (isRecording && start && now) {
    log('End recording');

    addIntervalToTimelog({
      date: formatDate(now),
      interval: [start, now]
    });

    document.getElementById('start-time').innerHTML = '';
    document.getElementById('current-time').innerHTML = '';
    isRecording = false, start = null;
    storage.setItem('isRecording', false);
    storage.setItem('start', null);
  }
}

// Event Listeners
document.addEventListener('keypress', handleKeypress);
function handleKeypress(e) {
  switch(e.keyCode) {
    // s - start
    case 83: startRecording(); break;
    // c - cancel 
    case 99: cancelRecording(); break;
    // enter - end      
    case 13: endRecording(); break;      
  }
}

document.getElementById('delete').addEventListener('click', function() {
  clearTimelog();
});


