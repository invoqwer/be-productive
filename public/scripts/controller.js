import {
  getDelta, formatDelta, aggregateDeltas, formatDate, formatDateYMD, formatTime
} from './time.js';

import {
  getTimelog, updateTimelog, deleteTimelog
} from './timelog.js';

const log = console.log;

// Update Views via AJAX Requests
getTimelog().then(res => {
  populateTimelog(res);
});

function postToTimelog(req) {
  log(req);
  updateTimelog(req)
    .then(res => {
      populateTimelog(res);
    }).catch(e => {
      alert(`${e.statusText} ${e.status}: ${e.response}`);
    });
}

function clearTimelog() {
  log('Clearing timelog');
  storage.removeItem('target');
  deleteTimelog().then(res => {
    populateTimelog(res);
  })
}

// Populate Timelog from JSON
function populateTimelog(data) {
  const tl = document.getElementById('timelog-wrapper');
  tl.innerHTML = '';

  let deltas = [];

  // Add Interval
  let addIntervalWrapper = document.createElement('div');
  addIntervalWrapper.id = 'addIntervalWrapper';
  addIntervalWrapper.classList.add('day');
  addIntervalWrapper.style.display = 'none';
  let dateIntervalInput = document.createElement('input');
  dateIntervalInput.setAttribute('type', 'date');
  dateIntervalInput.value = formatDateYMD(new Date());
  let startIntervalInput = document.createElement('input');
  startIntervalInput.setAttribute('type', 'time');
  startIntervalInput.required = true;
  let endIntervalInput = document.createElement('input');
  endIntervalInput.setAttribute('type', 'time');
  endIntervalInput.required = true;
  let submitInterval = document.createElement('button');
  submitInterval.innerText = 'Add Interval';
  submitInterval.addEventListener('click', function() {
    let [y, m, s] = dateIntervalInput.value.split('-');
    let [sh, ss] = startIntervalInput.value.split(':');
    let [eh, es] = endIntervalInput.value.split(':');
    log(y, m, s, sh, ss, eh, es);
    // months are 0-based
    postToTimelog({
      action: 'ADD',
      date: new Date(y, m-1, s),
      interval: [
        new Date(y, m-1, s, sh, ss),
        new Date(y, m-1, s, eh, es)
      ]
    });
  });
  addIntervalWrapper.appendChild(dateIntervalInput);
  addIntervalWrapper.appendChild(startIntervalInput);
  addIntervalWrapper.appendChild(endIntervalInput);
  addIntervalWrapper.appendChild(submitInterval);
  tl.appendChild(addIntervalWrapper);

  for (const [date, intervals] of Object.entries(data)) {
    let day = document.createElement('div');
    day.classList.add('day');
    
    // Days
    let dayHeader = document.createElement('div');
    dayHeader.classList.add('logHeader');
    dayHeader.innerText = formatDate(new Date(date));
    day.appendChild(dayHeader);

    let dayDeltas = [];

    // Intervals
    intervals.forEach(interval => {
      const [start, end] =
        [new Date(interval[0]), new Date(interval[1])];
      const delta = getDelta(start, end);
      dayDeltas.push(delta);

      let [left, middle, right, entry] =
        [document.createElement('div'),
         document.createElement('div'),
         document.createElement('div'),
         document.createElement('div')];

      right.classList.add('accent');
      right.style.cursor = 'pointer';
      left.innerText = formatTime(start, true);
      middle.innerText = formatTime(end, true);
      right.innerText = formatDelta(delta);
      right.addEventListener('click', () => {
        postToTimelog({
          action: 'DEL',
          date: date,
          interval: interval
        });
      });

      [left, middle, right].forEach((e) => {
        entry.appendChild(e);
      });
      entry.classList.add('log-entry');
      day.appendChild(entry);
    });

    // Day Aggregate
    let dayAggregate = document.createElement('div');
    dayAggregate.classList.add('logHeader', 'dayAggregate');

    let dayAggregateDelta = aggregateDeltas(dayDeltas);
    deltas.push(dayAggregateDelta);
    dayAggregate.innerText = `Day: ${formatDelta(dayAggregateDelta)}`;
    day.appendChild(dayAggregate);

    tl.appendChild(day);
  }

  // Total Aggregate
  if (Object.keys(data).length > 0) {
    let aggregate = document.createElement('div');
    aggregate.classList.add('logHeader', 'aggregate');

    aggregate.innerText = `Total: ${
      formatDelta(aggregateDeltas(deltas))
    }`;

    tl.appendChild(aggregate);
  }
}

function clearLocalStorage() {
  storage.removeItem('start');
  storage.removeItem('isRecording');
  storage.removeItem('target');
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
// clearLocalStorage();
let now, delta;
let [start, isRecording] = parseLocalStorage();
storage.removeItem('target');

function updateView() {
  now = new Date();
  const date = formatDate(now);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = formatTime(now);

  document.getElementById('info').innerText =
    `${now.toLocaleString()} - ${timezone}`;
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
    storage.removeItem('start');
  }
}

function endRecording() {
  if (isRecording && start && now) {
    log('End recording');

    postToTimelog({
      action: 'ADD',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      interval: [start, now]
    });

    document.getElementById('start-time').innerHTML = '';
    document.getElementById('current-time').innerHTML = '';
    isRecording = false, start = null;
    storage.setItem('isRecording', false);
    storage.removeItem('start');
  }
}

// Event listeners
// Key Press
document.addEventListener('keypress', handleKeypress);
function handleKeypress(e) {
  // log(e.keyCode);
  switch(e.keyCode) {
    // s - start
    case 115: startRecording(); break;
    // c - cancel
    case 99:
      if (isModal()) {
        hideModal();
      } else if (isRecording) {
        showModal('cancel');
      }
      break;
    // enter - end
    case 13:
      if (isModal()) {
        acceptModal();
      } else {
        endRecording();
      }
      break;
  }
}

// Show add interval UI
document.getElementById('addInterval').addEventListener('click',
  () => {
    addIntervalWrapper.style.display =
      (addIntervalWrapper.style.display === 'none') ?
        'block' :
        'none';
  });

// Modals
function isModal() {
  return document.getElementById('overlay').style.display === "block";
}

function showModal(id) {
  storage.setItem('target', id);
  document.getElementById('overlay').style.display = "block";
}

function hideModal() {
  document.getElementById('overlay').style.display = "none";
  storage.removeItem('target');
}

function acceptModal() {
  switch(storage.getItem('target')) {
    case 'delete': clearTimelog(); break;
    case 'cancel': cancelRecording(); break;
    default: log('Error accepting modal'); break;
  }
  hideModal();
}

document.getElementById('cancel').addEventListener('click', function() {
  hideModal();
});

document.getElementById('accept').addEventListener('click', function() {
  acceptModal();
});

document.getElementById('delete').addEventListener('click', function() {
  showModal('delete');
});

// different colors based on window focus
function setStyle(sheet) {
  document.getElementById('colors').setAttribute('href', sheet);  
}

document.body.addEventListener('mouseleave', _ => {
  setStyle('styles/colors-inactive.css');
});

document.body.addEventListener('mouseenter', _ => {
  setStyle('styles/colors-active.css');
});