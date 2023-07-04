const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const fs = require('fs');

// TODO: remove the MACOS file being generated after extraction of zip

function createSkeleton(remoteUrl, dir) {
  const savePath = './skeleton.zip';
  const extractPath = `./`;
  
  return new Promise((resolve, reject) => {
    // Download the zip file
    fetch(remoteUrl)
      .then(response => {
        if (!response.ok) {
          reject('Failed to download zip file.');
        }
        return response.buffer();
      })
      .then(buffer => {
        // Save the downloaded zip file
        fs.writeFileSync(savePath, buffer);

        // Create a new instance of AdmZip
        const zip = new AdmZip(savePath);

        // Extract all files from the zip archive
        zip.extractAllTo(extractPath, true);
        
        fs.unlinkSync(savePath);
        
        resolve('Zip file extracted successfully.');
      })
      .catch(error => {
        reject(error);
      });
  });
}

module.exports = {
  createSkeleton
}
