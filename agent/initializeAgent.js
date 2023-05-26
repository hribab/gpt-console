const fs = require('fs');
const path = require('path');
const PouchDB = require('pouchdb');
const { promisify } = require('util');
const pmx = require('pmx');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const directoryPath = '/path/to/directory';
const pouchDBPath = '/path/to/pouchdb/database';

// Create or open the PouchDB database
const db = new PouchDB(pouchDBPath);

pmx.init();

pmx.action('clearProgress', (reply) => {
  db.destroy()
    .then(() => {
      db = new PouchDB(pouchDBPath);
      reply({ success: true });
    })
    .catch((error) => {
      reply({ success: false, error: error.message });
    });
});

async function listFilesRecursively() {
  const resumeFrom = await db.get('progress').catch(() => null);

  if (resumeFrom) {
    console.log(`Resuming from file: ${resumeFrom.filePath}`);
    await traverseDirectory(resumeFrom.directoryPath, resumeFrom.filePath);
  } else {
    console.log('Starting from the beginning');
    await traverseDirectory(directoryPath);
  }

  console.log('Completed');
  process.exit();
}

async function traverseDirectory(directoryPath, resumeFile) {
  const files = await readdir(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileStats = await stat(filePath);

    if (fileStats.isDirectory()) {
      await traverseDirectory(filePath, resumeFile); // Recursively call the function for subdirectories
    } else {
      if (resumeFile && filePath <= resumeFile) {
        // Skip files before the resume file
        continue;
      }

      console.log(filePath); // Print the file path

      // Store the progress in PouchDB
      await db.put({
        _id: 'progress',
        directoryPath: directoryPath,
        filePath: filePath,
      });
    }
  }
}

listFilesRecursively();
