// Ajax Requests
const getTimelog = () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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
};

const updateTimelog = (data) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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
};

const deleteTimelog = () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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
};

export {
  getTimelog,
  updateTimelog,
  deleteTimelog,
};
