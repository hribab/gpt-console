const fs = require('fs');
const path = require('path');
const PouchDB = require('pouchdb');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);


const directoryPath = `${process.cwd()}`;
const pouchDBPath = `${process.cwd()}/pouchdb/`;


const db = new PouchDB(pouchDBPath);


const isLearningCompleted = await db.get('progress').catch(() => null);




// async function listFilesRecursively() {
//   const resumeFrom = await db.get('progress').catch(() => null);

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

//       console.log(filePath); // Print the file path

//       // Store the progress in PouchDB
//       await db.put({
//         _id: 'progress',
//         directoryPath: directoryPath,
//         filePath: filePath,
//       });
//     }
//   }
// }

// listFilesRecursively();



// async function listFilesRecursively() {
//   const resumeFrom = await db.get('progress').catch(() => null);

//   if (resumeFrom) {
//     console.log(`Resuming from file: ${resumeFrom.filePath}`);
//     await traverseDirectory(resumeFrom.directoryPath, resumeFrom.lastProcessedFile);
//   } else {
//     console.log('Starting from the beginning');
//     await traverseDirectory(directoryPath, null, false);
//   }

//   console.log('Completed');
//   // process.exit();
// }

// async function traverseDirectory(directoryPath, resumeFile, isResuming = false) {
//   const files = await readdir(directoryPath);

//   let shouldResume = isResuming;
  
//   for (const file of files) {
//     const filePath = path.join(directoryPath, file);
//     const fileStats = await stat(filePath);
//     if (fileStats.isDirectory()) {
//       console.log(file, foldersToIgnore.includes(file));
//       if (foldersToIgnore.includes(file)) {
//         continue;
//       }
//       await traverseDirectory(filePath, resumeFile, shouldResume); // Recursively call the function for subdirectories
//     } else {
//       const fileExtension = path.extname(filePath).toLowerCase();      
//       if (!fileExtension || fileExtension === '.' || !fileExtension.startsWith('.')) {
//         continue;
//       }

//       if (!shouldResume && resumeFile && filePath !== resumeFile) {
//         continue; // Skip files until reaching the resume file
//       }

//       if (!shouldResume && !resumeFile) {
//         shouldResume = true; // Set the flag to true if no resume file is specified
//       }
       
//        // Ignore files that do not match the specified extensions
//        if (fileExtension !== '.js' && fileExtension !== '.cs' && fileExtension !== '.sql') {
//         continue;
//       }

//       // Ignore files with non-code extensions
//       if (nonCodeFileExtensions.includes(fileExtension)) {
//         continue;
//       }

//       console.log(filePath); // Print the file path

//       if (!shouldResume) {
//         shouldResume = true; // Set the flag to true after reaching the resume file
//         continue; // Skip the resuming file
//       }

//       // await sleep(2000);

//       const docId = filePath; // Use the file path as the document ID

//       // Check if the document already exists
//       const existingDoc = await db.get(docId).catch(() => null);

//       if (existingDoc) {
//         // Document already exists, handle the conflict according to your requirements
//         console.log(`Skipping update for existing document: ${docId}`);
//         continue;
//       }

//       const progressDoc = await db.get('progress').catch(() => ({
//         _id: 'progress',
//         lastProcessedFile: '', // Initialize lastProcessedFile property
//       })); // Get the progress document if it exists, or create a new one

//       progressDoc.directoryPath = directoryPath;
//       progressDoc.lastProcessedFile = filePath; // Update lastProcessedFile property

//       await db.put(progressDoc); // Update the progress document in PouchDB

//       await db.put({
//         _id: filePath,
//         directoryPath: directoryPath,
//         fileName: file,
//         filePath: filePath,
//         teststatus: "pending",
//       });
//     }
//   }
// }

// async function listFilesWithPendingStatus() {
//   const pendingDocs = await db.allDocs({
//     startkey: '',
//     endkey: '\uffff',
//     include_docs: true,
//   });

//   const pendingFiles = pendingDocs.rows
//     .filter(row => row.doc.teststatus === 'pending')
//     .map(row => ({ filePath: row.doc.filePath, directoryPath: row.doc.directoryPath }));

//   const fileExtensions = {};

//   for (const { filePath, directoryPath } of pendingFiles) {
//     const fileExtension = path.extname(filePath).toLowerCase();
//     if (!fileExtensions[fileExtension]) {
//       fileExtensions[fileExtension] = {
//         total: 0,
//         files: []
//       };
//     }
//     fileExtensions[fileExtension].total++;
//     fileExtensions[fileExtension].files.push({ file: filePath, folder: directoryPath });
//   }

//   console.log('Files with pending test status:');
//   console.dir(fileExtensions, { depth: null });
// }

// async function botWriteUnitTests(fileName, testFile) {
//   const spinner = spinners.dots;    
//   const interval = setInterval(() => {
//       process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
//       spinner.interval++;
//   }, spinner.frameLength);
//   try {
//     const { fileContent, language } = cleanFileForPrompt(fileName);
//     const currentDir = process.cwd();
//     const filePath = path.relative(currentDir, fileName);
//     console.log(`Extracting functions from ${fileName}...`);
//     const finalPrompt = `${GENERATE_UNIT_TEST(language, filePath)} ${fileContent}`;

//     // await runSpinnerAndSaveResponse(finalPrompt, fileName, "unittests");
  
//     const response = await generateResponse(finalPrompt);
    
//     if (response === "error") { 
//       return "pending"
//     }
//     try {
//       await fs.writeFile(testFile, response);
//       clearInterval(interval);
//       process.stdout.write('\r');
//       return 'done';
//     } catch (err) {
//       // console.error(`Error saving file: ${err}`);
//       clearInterval(interval);
//       process.stdout.write('\r');
//       return "pending";
//     }    
//   } catch (err) {
//     clearInterval(interval);
//     process.stdout.write('\r');
//     return "pending";
//   }
// }

// async function startTheBot() {
//   const pendingDocs = await db.allDocs({
//     startkey: '',
//     endkey: '\uffff',
//     include_docs: true,
//   });

//   console.log('total:===>' + pendingDocs.total_rows);
//   const allPendingDocs = pendingDocs.rows.filter(row => row.doc.teststatus === 'pending').map(row => ({ filePath: row.doc.filePath, directoryPath: row.doc.directoryPath, fileName: row.doc.fileName }));
//   console.log('Todo:===>' + allPendingDocs.length);

//   for (const { filePath, directoryPath } of allPendingDocs) {
//     console.log('working on file filePath:===>' + filePath);
//     const testFilePath = filePath.replace('/sampletestfiles/', '/coverageresults/').replace(/(\.[^/.]+)$/, 'Test$1');

//     const testDirectoryPath = path.dirname(testFilePath);

//     console.log('test file save on file filePath:===>' + testFilePath);

//     // Create the necessary directories if they don't exist
//     await fs.ensureDir(testDirectoryPath);

//     // await fs.copyFile(filePath, testFilePath);

//     const status = await botWriteUnitTests(filePath, testFilePath)

//     const existingDoc = await db.get(filePath).catch(() => null);

//     if (existingDoc) {
//       const updatedDoc = {
//         ...existingDoc,
//         directoryPath: directoryPath,
//         filePath: filePath,
//         testFilePath: testFilePath,
//         teststatus: status,
//       };
//       await db.put(updatedDoc);
//     } else {
//       const newDoc = {
//         _id: filePath,
//         directoryPath: directoryPath,
//         filePath: filePath,
//         testFilePath: testFilePath,
//         teststatus: status,
//       };
//       await db.put(newDoc);
//     }

//     await sleep(3000);
//   }
//   return;
// }

// const listFiles = async () => { 

//   await listFilesRecursively()
//   await listFilesWithPendingStatus()
// }




// // // answer questions 


// // const filePath = path.join(__dirname, 'time.txt');

// // setInterval(() => {
// //   const now = new Date();
// //   const currentTime = now.toISOString() + '\n'; // add a newline for each entry

// //   fs.appendFile(filePath, currentTime, (err) => {
// //     if (err) {
// //       console.error('Error writing to file:', err);
// //     } else {
// //       console.log('Wrote time to file:', currentTime);
// //     }
// //   });
// // }, 2000); // 2000 milliseconds = 2 seconds