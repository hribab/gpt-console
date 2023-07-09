

    // async function listFilesRecursively() {
    //   const resumeFrom = await db.get('progress').catch(() => null);

    //   if (resumeFrom) {
    //     console.log(`Resuming from file: ${resumeFrom.filePath}`);
    //     await traverseDirectory(resumeFrom.directoryPath, resumeFrom.lastProcessedFile);
    //   } else {
    //     console.log('Starting from the beginning');
    //     await traverseDirectory(directoryPath, null, false);
    //   }

    //   db.put({
    //     _id: 'isLearningCompleted',
    //     status: "completed",
    //     summary: {totalfiles: ""}
    //   })
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
    //       // console.log(file, foldersToIgnore.includes(file));
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
          
    //       // Ignore files that do not match the specified extensions
    //       if (fileExtension !== '.js' && fileExtension !== '.cs' && fileExtension !== '.sql') {
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

    //       await sleep(2000);

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
    //         learning: "done",
    //         gptprocess: "pending",
    //       });
    //     }
    //   }
    // }

    // await listFilesRecursively();