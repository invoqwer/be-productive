import {
  getDelta,
  formatDelta,
  aggregateDeltas,
  formatDate,
  formatDateYMD,
  formatTime,
} from './time.js';

import {
  getTimelog,
  updateTimelog,
  deleteTimelog,
} from './timelog.js';

const log = console.log;

// Update Views via AJAX Requests
getTimelog().then((res) => {
  populateTimelog(res);
});

const postToTimelog = (req) => {
  log(req);
  updateTimelog(req)
      .then((res) => populateTimelog(res))
      .catch((e) =>
        alert(`${e.statusText} ${e.status}: ${e.response}`));
};

const clearTimelog = () => {
  log('Clearing timelog');
  storage.removeItem('target');
  deleteTimelog().then((res) => populateTimelog(res));
};

// Populate Timelog from JSON
function populateTimelog(data) {
  const tl = document.getElementById('timelog-wrapper');
  const deltas = [];
  tl.innerHTML = '';

  // Add Interval
  const [
    addIntervalWrapper,
    dateIntervalInput,
    startIntervalInput,
    endIntervalInput,
    submitInterval,
  ] =
  [
    document.createElement('div'),
    document.createElement('input'),
    document.createElement('input'),
    document.createElement('input'),
    document.createElement('button'),
  ];

  addIntervalWrapper.id = 'addIntervalWrapper';
  addIntervalWrapper.classList.add('day');
  addIntervalWrapper.style.display = 'none';
  dateIntervalInput.setAttribute('type', 'date');
  dateIntervalInput.value = formatDateYMD(new Date());
  startIntervalInput.setAttribute('type', 'time');
  startIntervalInput.required = true;
  endIntervalInput.setAttribute('type', 'time');
  endIntervalInput.required = true;
  submitInterval.innerText = 'Add Interval';
  submitInterval.addEventListener('click', () => {
    const [y, m, s] = dateIntervalInput.value.split('-');
    const [sh, ss] = startIntervalInput.value.split(':');
    const [eh, es] = endIntervalInput.value.split(':');
    log(y, m, s, sh, ss, eh, es);
    // months are 0-based
    postToTimelog({
      action: 'ADD',
      date: new Date(y, m-1, s),
      interval: [
        new Date(y, m-1, s, sh, ss),
        new Date(y, m-1, s, eh, es),
      ],
    });
  });
  addIntervalWrapper.appendChild(dateIntervalInput);
  addIntervalWrapper.appendChild(startIntervalInput);
  addIntervalWrapper.appendChild(endIntervalInput);
  addIntervalWrapper.appendChild(submitInterval);
  tl.appendChild(addIntervalWrapper);

  for (const [date, intervals] of Object.entries(data)) {
    const day = document.createElement('div');
    day.classList.add('day');

    // Days
    const dayHeader = document.createElement('div');
    dayHeader.classList.add('logHeader');
    dayHeader.innerText = formatDate(new Date(date));
    day.appendChild(dayHeader);

    const dayDeltas = [];

    // Intervals
    intervals.forEach((interval) => {
      const [start, end] =
        [new Date(interval[0]), new Date(interval[1])];
      const delta = getDelta(start, end);
      dayDeltas.push(delta);

      const [left, middle, right, entry] = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ];

      right.classList.add('accent');
      right.style.cursor = 'pointer';
      left.innerText = formatTime(start, true);
      middle.innerText = formatTime(end, true);
      right.innerText = formatDelta(delta);
      right.addEventListener('click', () => {
        postToTimelog({
          action: 'DEL',
          date: date,
          interval: interval,
        });
      });

      [left, middle, right].forEach((e) => {
        entry.appendChild(e);
      });
      entry.classList.add('log-entry');
      day.appendChild(entry);
    });

    // Day Aggregate
    const dayAggregate = document.createElement('div');
    dayAggregate.classList.add('logHeader', 'dayAggregate');

    const dayAggregateDelta = aggregateDeltas(dayDeltas);
    deltas.push(dayAggregateDelta);
    dayAggregate.innerText = `Day: ${formatDelta(dayAggregateDelta)}`;
    day.appendChild(dayAggregate);

    tl.appendChild(day);
  }

  // Total Aggregate
  if (Object.keys(data).length > 0) {
    const aggregate = document.createElement('div');
    aggregate.classList.add('logHeader', 'aggregate');

    aggregate.innerText = `Total: ${
      formatDelta(aggregateDeltas(deltas))
    }`;

    tl.appendChild(aggregate);
  }
}

// eslint-disable-next-line
const clearLocalStorage = () => {
  storage.removeItem('start');
  storage.removeItem('isRecording');
  storage.removeItem('target');
};

// Update Time + Local Storage
const parseLocalStorage = () => {
  let start = storage.getItem('start');
  let isRecording = storage.getItem('isRecording');
  start = start ? new Date(start) : null;
  isRecording = (isRecording === 'true') ? true : false;
  return [start, isRecording];
};

const storage = window.localStorage;
// clearLocalStorage();
let now;
let delta;
let [start, isRecording] = parseLocalStorage();
storage.removeItem('target');

const updateView = () => {
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
};
setInterval(updateView, 1000);

// Recording
const startRecording = () => {
  if (!isRecording && now) {
    log('Start recording');
    isRecording = true, start = now;
    storage.setItem('isRecording', true);
    storage.setItem('start', now);
  }
};

const cancelRecording = () => {
  if (isRecording) {
    log('Cancel recording');

    document.getElementById('start-time').innerHTML = '';
    document.getElementById('current-time').innerHTML = '';
    isRecording = false, start = null;
    storage.setItem('isRecording', false);
    storage.removeItem('start');
  }
};

const endRecording = () => {
  if (isRecording && start && now) {
    log('End recording');

    postToTimelog({
      action: 'ADD',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      interval: [start, now],
    });

    document.getElementById('start-time').innerHTML = '';
    document.getElementById('current-time').innerHTML = '';
    isRecording = false, start = null;
    storage.setItem('isRecording', false);
    storage.removeItem('start');
  }
};

// Event listeners
// Key Press
document.addEventListener('keypress', (e) => {
  switch (e.key) {
    // s - start
    case 's': startRecording(); break;
    // c - cancel
    case 'c':
      if (isModal()) {
        hideModal();
      } else if (isRecording) {
        showModal('cancel');
      }
      break;
    // enter - end
    case 'Enter':
      if (isModal()) {
        acceptModal();
      } else {
        endRecording();
      }
      break;
  }
});

// Show add interval UI
document.getElementById('addInterval')
    .addEventListener('click', () => {
      const wrapper = document.getElementById('addIntervalWrapper');
      wrapper.style.display =
        (wrapper.style.display === 'none') ?
          'block' :
          'none';
    });

// Modals
const isModal = () => {
  return document.getElementById('overlay').style.display === 'block';
};

const showModal = (id) => {
  storage.setItem('target', id);
  document.getElementById('overlay').style.display = 'block';
};

const hideModal = () => {
  document.getElementById('overlay').style.display = 'none';
  storage.removeItem('target');
};

const acceptModal = () => {
  switch (storage.getItem('target')) {
    case 'delete': clearTimelog(); break;
    case 'cancel': cancelRecording(); break;
    default: log('Error accepting modal'); break;
  }
  hideModal();
};

document.getElementById('cancel')
    .addEventListener('click', () => hideModal());

document.getElementById('accept')
    .addEventListener('click', () => acceptModal());

document.getElementById('delete')
    .addEventListener('click', () => showModal('delete'));

// different colors based on window focus
const setStyle = (sheet) =>
  document.getElementById('colors').setAttribute('href', sheet);

document.body.addEventListener('mouseleave', () =>
  setStyle('styles/colors-inactive.css'));

document.body.addEventListener('mouseenter', () =>
  setStyle('styles/colors-active.css'));
