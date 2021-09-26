// Ajax Requests
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

// data format: see formatDate(<Date Object>)
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

export { getTimelog, updateTimelog, deleteTimelog }