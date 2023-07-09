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

// pmx
// list files 
// save pinecode
// answer questions
pmx.init();



 // case "lf":
    //   await listFiles();
    //   callback(null, );
    //   break;
    // case "start":
    //   await startTheBot();
    //   callback(null, );
    //   break;
    // case "sastopy":
    //   await sasToPy();
    //   callback(null, );
    //   break;
    // case "sfdccover":
    //   await sfdccover();
    //   callback(null, );
    //   break;



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



async function listFilesRecursively() {
  const resumeFrom = await db.get('progress').catch(() => null);

  if (resumeFrom) {
    console.log(`Resuming from file: ${resumeFrom.filePath}`);
    await traverseDirectory(resumeFrom.directoryPath, resumeFrom.lastProcessedFile);
  } else {
    console.log('Starting from the beginning');
    await traverseDirectory(directoryPath, null, false);
  }

  console.log('Completed');
  // process.exit();
}

async function traverseDirectory(directoryPath, resumeFile, isResuming = false) {
  const files = await readdir(directoryPath);

  let shouldResume = isResuming;
  
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      console.log(file, foldersToIgnore.includes(file));
      if (foldersToIgnore.includes(file)) {
        continue;
      }
      await traverseDirectory(filePath, resumeFile, shouldResume); // Recursively call the function for subdirectories
    } else {
      const fileExtension = path.extname(filePath).toLowerCase();      
      if (!fileExtension || fileExtension === '.' || !fileExtension.startsWith('.')) {
        continue;
      }

      if (!shouldResume && resumeFile && filePath !== resumeFile) {
        continue; // Skip files until reaching the resume file
      }

      if (!shouldResume && !resumeFile) {
        shouldResume = true; // Set the flag to true if no resume file is specified
      }
       
       // Ignore files that do not match the specified extensions
       if (fileExtension !== '.js' && fileExtension !== '.cs' && fileExtension !== '.sql') {
        continue;
      }

      // Ignore files with non-code extensions
      if (nonCodeFileExtensions.includes(fileExtension)) {
        continue;
      }

      console.log(filePath); // Print the file path

      if (!shouldResume) {
        shouldResume = true; // Set the flag to true after reaching the resume file
        continue; // Skip the resuming file
      }

      // await sleep(2000);

      const docId = filePath; // Use the file path as the document ID

      // Check if the document already exists
      const existingDoc = await db.get(docId).catch(() => null);

      if (existingDoc) {
        // Document already exists, handle the conflict according to your requirements
        console.log(`Skipping update for existing document: ${docId}`);
        continue;
      }

      const progressDoc = await db.get('progress').catch(() => ({
        _id: 'progress',
        lastProcessedFile: '', // Initialize lastProcessedFile property
      })); // Get the progress document if it exists, or create a new one

      progressDoc.directoryPath = directoryPath;
      progressDoc.lastProcessedFile = filePath; // Update lastProcessedFile property

      await db.put(progressDoc); // Update the progress document in PouchDB

      await db.put({
        _id: filePath,
        directoryPath: directoryPath,
        fileName: file,
        filePath: filePath,
        teststatus: "pending",
      });
    }
  }
}

async function listFilesWithPendingStatus() {
  const pendingDocs = await db.allDocs({
    startkey: '',
    endkey: '\uffff',
    include_docs: true,
  });

  const pendingFiles = pendingDocs.rows
    .filter(row => row.doc.teststatus === 'pending')
    .map(row => ({ filePath: row.doc.filePath, directoryPath: row.doc.directoryPath }));

  const fileExtensions = {};

  for (const { filePath, directoryPath } of pendingFiles) {
    const fileExtension = path.extname(filePath).toLowerCase();
    if (!fileExtensions[fileExtension]) {
      fileExtensions[fileExtension] = {
        total: 0,
        files: []
      };
    }
    fileExtensions[fileExtension].total++;
    fileExtensions[fileExtension].files.push({ file: filePath, folder: directoryPath });
  }

  console.log('Files with pending test status:');
  console.dir(fileExtensions, { depth: null });
}

async function botWriteUnitTests(fileName, testFile) {
  const spinner = spinners.dots;    
  const interval = setInterval(() => {
      process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
      spinner.interval++;
  }, spinner.frameLength);
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const currentDir = process.cwd();
    const filePath = path.relative(currentDir, fileName);
    console.log(`Extracting functions from ${fileName}...`);
    const finalPrompt = `${GENERATE_UNIT_TEST(language, filePath)} ${fileContent}`;

    // await runSpinnerAndSaveResponse(finalPrompt, fileName, "unittests");
  
    const response = await generateResponse(finalPrompt);
    
    if (response === "error") { 
      return "pending"
    }
    try {
      await fs.writeFile(testFile, response);
      clearInterval(interval);
      process.stdout.write('\r');
      return 'done';
    } catch (err) {
      // console.error(`Error saving file: ${err}`);
      clearInterval(interval);
      process.stdout.write('\r');
      return "pending";
    }    
  } catch (err) {
    clearInterval(interval);
    process.stdout.write('\r');
    return "pending";
  }
}

async function startTheBot() {
  const pendingDocs = await db.allDocs({
    startkey: '',
    endkey: '\uffff',
    include_docs: true,
  });

  console.log('total:===>' + pendingDocs.total_rows);
  const allPendingDocs = pendingDocs.rows.filter(row => row.doc.teststatus === 'pending').map(row => ({ filePath: row.doc.filePath, directoryPath: row.doc.directoryPath, fileName: row.doc.fileName }));
  console.log('Todo:===>' + allPendingDocs.length);

  for (const { filePath, directoryPath } of allPendingDocs) {
    console.log('working on file filePath:===>' + filePath);
    const testFilePath = filePath.replace('/sampletestfiles/', '/coverageresults/').replace(/(\.[^/.]+)$/, 'Test$1');

    const testDirectoryPath = path.dirname(testFilePath);

    console.log('test file save on file filePath:===>' + testFilePath);

    // Create the necessary directories if they don't exist
    await fs.ensureDir(testDirectoryPath);

    // await fs.copyFile(filePath, testFilePath);

    const status = await botWriteUnitTests(filePath, testFilePath)

    const existingDoc = await db.get(filePath).catch(() => null);

    if (existingDoc) {
      const updatedDoc = {
        ...existingDoc,
        directoryPath: directoryPath,
        filePath: filePath,
        testFilePath: testFilePath,
        teststatus: status,
      };
      await db.put(updatedDoc);
    } else {
      const newDoc = {
        _id: filePath,
        directoryPath: directoryPath,
        filePath: filePath,
        testFilePath: testFilePath,
        teststatus: status,
      };
      await db.put(newDoc);
    }

    await sleep(3000);
  }
  return;
}

const listFiles = async () => { 

  await listFilesRecursively()
  await listFilesWithPendingStatus()
}

const sfdccover = async () => { 
  const directoryPath = `${process.cwd()}/salesforce/`;
  const files = await readdir(directoryPath);  

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileExtension = path.extname(filePath).toLowerCase();      
    if (fileExtension === '.xml') {
      continue;
    }
    console.log(filePath); // Print the file path

    const spinner = spinners.dots;    
    const interval = setInterval(() => {
        process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
        spinner.interval++;
    }, spinner.frameLength);
    try {
      const { fileContent: sfdcContent, language: ln1 } = cleanFileForPrompt(filePath);
      const { fileContent:  xmlContent, language: ln2} = cleanFileForPrompt(`${filePath}-meta.xml`);
      console.log(`sfdc--- ${sfdcContent}...xmlContent---${xmlContent}`);
      const testFile = filePath.replace('/salesforce/', '/salesforcetest/').replace(/\.cls$/, "Test.cls");

      console.log(`Writing unit tests for  ${filePath}...`);
      const finalPrompt = `The task is to write unit test cases for salesforce code and return the test code which is executable.

        1. before writing test cases, clean the code by removing all the code comments.
        2. Each function found in the code file should have at least five test cases.
        3. Aim for a minimum of 90% code coverage.
        4. Each test case should be accompanied by code comments.
        5. Test code should be executable.
        
        The response should only contain the unit test code,  provide the code without explicitly mentioning the language. 
        salesforce code: \n
        ${sfdcContent}
        XML Metadata:
        ${xmlContent}
        `;
      
    
      const response = await generateResponse(finalPrompt);
      
      if (response === "error") {
        continue;
      }
      try {
        await fs.writeFile(testFile, response);
        clearInterval(interval);
        process.stdout.write('\r');
        console.log('done');
      } catch (err) {
        // console.error(`Error saving file: ${err}`);
        clearInterval(interval);
        process.stdout.write('\r');
        console.log('error---', err);
        continue
      }    
    } catch (err) {
      clearInterval(interval);
      process.stdout.write('\r');
      console.log('error', err);
      continue;
    }
    }
}
  
const sasToPy = async () => { 
  const directoryPath = `${process.cwd()}/SAS_files/`;
  const files = await readdir(directoryPath);  
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    console.log(filePath); // Print the file path
    const spinner = spinners.dots;    
    const interval = setInterval(() => {
        process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
        spinner.interval++;
    }, spinner.frameLength);
    try {
      const { fileContent, language } = cleanFileForPrompt(filePath);

      const testFile = filePath.replace('/SAS_files/', '/sastopy/').replace(/\.sas$/, ".py");

      console.log(`Converting SAS code from ${filePath}...`);
      const finalPrompt = `The objective of this task is to transform the provided SAS code into an equivalent Python script. Here are the specific requirements for this conversion:
      1. The final Python output should be fully executable with an active Python environment.
      2. The conversion should encompass 100% of the provided SAS code. If a direct conversion is not feasible due to any specific SAS features that Python doesn't support, please annotate these segments with a "TODO" comment, explaining why the conversion isn't achievable and outlining any potential next steps or alternatives.
      3. The converted Python code should be designed for seamless integration, requiring minimal or ideally no manual adjustment post-conversion.
      4. At the conclusion of the converted Python script, please include a comment labeled "Manual Integration Steps", which should detail any steps a developer would need to undertake to integrate this Python script into an existing codebase or repository.
      5. As this is enterprise-grade code, the converted Python script must adhere to high standards of code quality. Please ensure it is error-free, syntactically correct, and reviewed thoroughly for potential issues.
      SAS Code:
 
      ${fileContent}`;
      
    
      const response = await generateResponse(finalPrompt);
      
      if (response === "error") {
        return "pending"
      }
      try {
        await fs.writeFile(testFile, response);
        clearInterval(interval);
        process.stdout.write('\r');
        console.log('done');
      } catch (err) {
        // console.error(`Error saving file: ${err}`);
        clearInterval(interval);
        process.stdout.write('\r');
        console.log('error---', err);
        continue
      }    
    } catch (err) {
      clearInterval(interval);
      process.stdout.write('\r');
      console.log('error', err);
      continue;
    }
    }
}




// try {
//   pm2.connect(function (err) {
//     if (err) {
//       console.error(err);
//       process.exit(2);
//     }


//     // pm2.list((err, processDescriptionList) => {
//     //   if (err) throw err;

//     //   console.log(processDescriptionList);

//     //   pm2.disconnect();
//     // });
//     pm2.start({
//       script: 'jedi.js', // your script path
//       name: 'jedi',      // optional name for easier management
//       exec_mode: 'fork',     // mode to start your application
//       autorestart: true,     // application will be restarted if crashed
//       max_memory_restart: '1G' // application will be restarted if it exceeds the max memory
//     }, function (err, apps) {
//       pm2.disconnect(); // disconnects from PM2
//       if (err) throw err
//     });

//     // pm2.stop("jedi", function(err, apps) {
//     //   pm2.disconnect();   // Disconnects from PM2
//     //   if (err) throw err
//     // });
//   })
// } catch (error) {
//   console.log(error);
// }