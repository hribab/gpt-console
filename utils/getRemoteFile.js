var request = require('request');

function getRemoteFile(path) {
  return new Promise((resolve, reject) => {
    request.get(path, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

module.exports = {
  getRemoteFile
}
