// const GitignoreParser = require('gitignore-parser');
// const minimatch = require('minimatch');


// const fs = require('fs');
// const path = require('path');
// var PouchDB = require('pouchdb');
// PouchDB.plugin(require('pouchdb-adapter-memory'));
// const { promisify } = require('util');
// const pmx = require('pmx');

// const readdir = promisify(fs.readdir);
// const stat = promisify(fs.stat);

// const directoryPath = process.cwd();

// // Create or open the PouchDB database
// // const db = new PouchDB('mydb', { adapter: 'memory' });

// const pouchDBPath = "/Users/hari/onroad/commandlinetool/pouchdb"

// // Create or open the PouchDB database
// const db = new PouchDB(pouchDBPath);

// pmx.init();

// pmx.action('clearProgress', (reply) => {
//   db.destroy()
//     .then(() => {
//       db = new PouchDB(pouchDBPath);
//       reply({ success: true });
//     })
//     .catch((error) => {
//       reply({ success: false, error: error.message });
//     });
// });

// async function listFilesRecursively() {
//   const resumeFrom = await db.get('progress').catch(() => null);
//   console.log("resumeFrom---", resumeFrom);
//   if (resumeFrom) {
//     console.log(`Resuming from file: ${resumeFrom.filePath}`);
//     await traverseDirectory(resumeFrom.directoryPath, resumeFrom.filePath);
//   } else {
//     console.log('Starting from the beginning');
//     await traverseDirectory(directoryPath);
//   }

//   console.log('Completed');
//   process.exit();
  
// }

// async function traverseDirectory(directoryPath, resumeFile) {
//   const files = await readdir(directoryPath);

//   for (const file of files) {
//     const filePath = path.join(directoryPath, file);
//     const fileStats = await stat(filePath);

//     if (fileStats.isDirectory()) {
//       await traverseDirectory(filePath, resumeFile); // Recursively call the function for subdirectories
//     } else {
//       if (resumeFile && filePath <= resumeFile) {
//         // Skip files before the resume file
//         continue;
//       }

//       await sleep(2000); // Sleep for 2 seconds

//       console.log(filePath); // Print the file path

//       // Store the progress in PouchDB
//       await updateProgress({
//         directoryPath: directoryPath,
//         filePath: filePath,
//       });
//     }
//   }
// }

// function sleep(ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }
// async function updateProgress(progressData) {
//   try {
//     const doc = await db.get('progress');
//     doc.directoryPath = progressData.directoryPath;
//     doc.filePath = progressData.filePath;
//     await db.put(doc);
//   } catch (error) {
//     if (error.status === 404) {
//       await db.put({
//         _id: 'progress',
//         directoryPath: progressData.directoryPath,
//         filePath: progressData.filePath,
//       });
//     } else {
//       throw error;
//     }
//   }
// }
// listFilesRecursively();

