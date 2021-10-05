// zero pad to 2 digits
function zeroPad(num) {
  return num < 10 ? `0${num}` : num;
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

// Deltas
function getDelta(start, end) {
  let delta = Math.abs(start - end) / 1000;

  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;
  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;
  const seconds = Math.floor(delta % 60);

  return [hours, minutes, seconds];
}

// [ [hh,mm,ss], ... ]
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

// Format Time

// format 24 hours to 12 hours
function formatHours(hours) {
  return {
    num: +hours % 12 || 12,
    meridiem: +hours < 12 ? 'AM' : 'PM'
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

function formatDate(date) {
  const year = date.getFullYear();
  const month = formatMonth(date.getMonth());
  const day = date.getDate();
  const weekday = formatWeekday(date.getDay());
  return `${weekday} ${month}.${day} ${year}`;
}

// return: yyyy-mm-dd
function formatDateYMD(date) {
  const year = date.getFullYear();
  const month = zeroPad(date.getMonth()+1);
  const day = zeroPad(date.getDate());
  return `${year}-${month}-${day}`;
}

function formatTime(date, includeSeconds = false) {
  const hours = formatHours(date.getHours());
  const minutes = zeroPad(date.getMinutes());
  const seconds = zeroPad(date.getSeconds());

  return (includeSeconds === true) ? 
    `${hours.num}:${minutes}:${seconds} ${hours.meridiem}` :
    `${hours.num}:${minutes} ${hours.meridiem}`;
}

export { getDelta, formatDelta, aggregateDeltas, formatDate, formatDateYMD, formatTime }