// const madge = require('madge');
// const fs = require('fs');
// const path = require('path');
// const gitignoreToGlob = require('gitignore-to-glob');
// const minimatch = require('minimatch');

// function getDependencyJson(repositoryRoot) {
//   // Read the .gitignore file
    
//     const gitignorePath = `${repositoryRoot}/.gitignore`;
//     try {
//         fs.accessSync(gitignorePath, fs.constants.R_OK);
//         gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
//     } catch (error) {
//         console.error('Error: Unable to read .gitignore file:', error);
//         gitignoreContent = '';
//     }

//     // Convert gitignore rules to glob patterns
//     let gitignorePatterns;
//     let ignorePatterns = []
//     try {
//     // Filter out empty lines and comments

//     // const filteredLines = gitignoreContent
//     //     .split('\n')
//     //     .map(line => line.trim())
//     //     .filter(line => line !== '' && !line.startsWith('#'));

//     // // Check if the node_modules exclusion is present

//     // // Append `**/node_modules/` prefix to directory exclusions if necessary
//     // let processedLines = filteredLines.map(line => line.endsWith('/') ? `**/${line}` : line);
//     // processedLines.push('/node_modules');
//     // const excludeGit = !filteredLines.some(line => line === '.git/');
//     // if (excludeGit) {
//     //     processedLines.push('.git/');
//     // }
//     // // Convert gitignore rules to glob patterns
//     // ignorePatterns = processedLines.map(line => path.join(repositoryRoot, line));
    
        
//     if (fs.existsSync(repositoryRoot + '/.gitignore')) {
//         gitignorePatterns = gitignoreToGlob(repositoryRoot + '/.gitignore') || [];
//         gitignorePatterns = gitignorePatterns.map(
//           pattern => (pattern.substr(pattern.length - 1) === '/' ? `${pattern}**/*` : pattern)
//         );
//         ignorePatterns.push(...gitignorePatterns);
//         ignorePatterns.push('!.git');
//         ignorePatterns.push('node_modules');

//         ignorePatterns = ignorePatterns.map(pattern => pattern.replace('!', ''));
//     }     

//     console.log("====ignorePatterns====", ignorePatterns)
//     } catch (error) {
//     console.error('Error: Unable to convert gitignore rules to glob patterns:', error);
//     ignorePatterns = [];
//     }
    

//   // Function to recursively get all files in a directory
//   function getAllFiles(directory) {
//     const files = [];

//     // Read the directory
//     const fileNames = fs.readdirSync(directory);

//     // Iterate over the files and directories
//     fileNames.forEach((fileName) => {
//       const filePath = path.join(directory, fileName);
//       const isDirectory = fs.statSync(filePath).isDirectory();

//     if (isDirectory) {
//         if (filePath.includes("node_modules")) { 
//             return;
//         }
//         if (filePath.includes(".git")) { 
//             return;
//         }
//         // If it's a directory, recursively get files in it
//         const nestedFiles = getAllFiles(filePath);
//         files.push(...nestedFiles);
//       } else {
//         // If it's a file, add it to the list
//         files.push(filePath);
//       }
//     });

//     return files;
//   }

//   // Get all files in the repository except ignored files
//     const files = getAllFiles(repositoryRoot)
//     //     .filter(str => {
//     //     return ignorePatterns.some(pattern => new minimatch.Minimatch(pattern).match(str));
//     //   });
  
//   // Run madge on the files
//   return madge(files)
//     .then(res => res.obj())
//     .catch(err => {
//       console.error('Error: Unable to generate dependency graph.', err);
//       return {};
//     });
// }

// // // Usage example
// // getDependencyJson('/path/to/repository')
// //   .then(dependencies => {
// //     console.log('Dependency JSON:', dependencies);
// //   });


//   // Export the functions
//   module.exports = {
//     getDependencyJson
//   };



//   try {
//     console.log("===theutilfuncs=====", codescan.func1());
//     console.log("===github=====",github.func1());
//     console.log("===documentation=====",documentation.func1());
//     const currentDirectory = __dirname;

//     dependencyGraph.getDependencyJson(currentDirectory)
//     .then(dependencies => {
//       console.log('Dependency JSON:', dependencies);
//     });

//     let fileContent = fs.readFileSync('cli.js', 'utf8');
//     // Remove the shebang line if present
//     const cleanFileContent = fileContent.replace(/^#!.*/, '');

//     // Parse the code into an AST
//     const ast = recast.parse(cleanFileContent);

//     // Visitor to remove comments and stale code
//     const visitor = {
//       visitNode(path) {
//         // Remove single-line comments
//         if (path.node.comments && path.node.comments.length > 0) {
//           path.node.comments = path.node.comments.filter(comment => comment.type !== 'Line');
//         }
//         this.traverse(path);
//       },
//       visitBlock(path) {
//         // Remove block comments
//         path.replace();
//         this.traverse(path);
//       },
//       visitEmptyStatement(path) {
//         // Remove empty statements
//         path.prune();
//         return false;
//       },
//       visitProgram(path) {


//         // Remove end-of-file comments
//         if (path.node.comments) {
//           path.node.comments = path.node.comments.filter(comment => !comment.trailing);
//         }

//         const body = path.get('body');
//         if (body && body.length > 0) {
//           // Find the last index of `ExpressionStatement`
//           let lastIndex = -1;
//           for (let i = body.length - 1; i >= 0; i--) {
//             const node = body[i];
//             if (node.type === 'ExpressionStatement') {
//               lastIndex = i;
//               break;
//             }
//           }

//           if (lastIndex !== -1) {
//             // Remove all nodes after the last `ExpressionStatement`
//             path.node.body = path.node.body.slice(0, lastIndex + 1);
//           }
//         }

//         if (path.node.comments && path.node.comments.length > 0) {
//           // Remove top-level comments
//           path.node.comments = [];
//         }

//         this.traverse(path);
        
//         // const body = path.get('body');
//         // if (body && body.length > 0) {
//         //   // Find the last node that matches `ExpressionStatement` followed by `};`
//         //   let lastIndex = -1;
//         //   for (let i = body.length - 1; i >= 0; i--) {
//         //     const node = body[i];
//         //     if (
//         //       node.type === 'ExpressionStatement' &&
//         //       node.expression.type === 'Literal' &&
//         //       typeof node.expression.value === 'string' &&
//         //       node.expression.value.endsWith('};')
//         //     ) {
//         //       lastIndex = i;
//         //       break;
//         //     }
//         //   }
  
//         //   if (lastIndex !== -1) {
//         //     // Remove all nodes after the last `};`
//         //     path.node.body = path.node.body.slice(0, lastIndex + 1);
//         //   }
//         // }
  
//         // if (path.node.comments && path.node.comments.length > 0) {
//         //   // Remove top-level comments
//         //   path.node.comments = [];
//         // }
  
//         // this.traverse(path);


        
//       },
//       // Add more conditions for removing other types of stale code
//     };


//     // Apply the visitor to remove comments and stale code
//     recast.visit(ast, visitor);

//     // Generate the modified code
//     const modifiedCode = recast.print(ast).code;

//     console.log('=====output=======');
//     // console.log(modifiedCode.replace(/(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/g, ''));

//     fs.writeFileSync(`nocomments.js`, modifiedCode.replace(/(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/g, ''), (err) => {
//       if (err) throw err;
//       // console.log(`All functions updated successfully in ${filePath}`);
//     });
  
//     // console.log(modifiedCode);
        

//   } catch (error) {
//     console.error('An error occurred while reading or parsing the file:');
//     console.error(error);
//   }
//   break;
