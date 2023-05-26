#!/usr/bin/env node

const repl = require("repl");
const codescan = require('./learn/codescan/learn_from_codescan');
const github = require('./learn/github/learnFromGithub');
const documentation = require('./learn/othersources/learnFromDocumentation');
const dependencyGraph = require('./learn/ast/dependencyGraph');

const { exec, spawn } = require("child_process");
const spinners = require("cli-spinners"); // TODO: use this to show spinner while waiting for response
const fs = require('fs');
const path = require('path');
const functionRegex = /function\s+(\w+)\s*\(/gm;
const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\((?:\w+(?:,\s*\w+)*)?\)\s*=>/gm;
const { completer } = require('readline');
const chalk = require('chalk');
const prettier = require('prettier');
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-adapter-memory'));
const { Client } = require('ssh2');
const recast = require('recast');
const { builders } = recast.types;
const gitignoreToGlob = require('gitignore-to-glob');

const madge = require('madge');


const fsextra = require('fs-extra');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

const { transformFromAstSync } = require('@babel/core');

// Create a new SSH connection
const conn = new Client();

const { Queue, Worker, QueueEvents } = require('bullmq');

// const queue = new Queue('Paint');

// queue.add('cars', { color: 'blue' });

// const childJob = await queue.add('child', { data: 'childData' }, { parentId: [parentJob1.id, parentJob2.id] });
// the child job depends on both parent1 and parent2 jobs and will only be processed after both parent jobs have completed successfully.

// const worker = new Worker('Paint', async job => {
//   if (job.name === 'cars') {
//     console.log("====paint worker===", job.data.color);
//     console.log('Starting job...');
//     await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // wait for 1 minute
//     console.log('Job completed!');
//     return { result: 'success' };
//   }
// });


// async function listActiveJobs(queueName) {
//   const queue = new Queue(queueName);
//   const jobs = await queue.getActive();

//   jobs.forEach(job => {
//     console.log(`Job ID: ${job.id}`);
//     console.log(`Job name: ${job.name}`);
//     console.log(`Job data: ${JSON.stringify(job.data)}`);
//   });
// }

// listActiveJobs('Paint');

// const queueEvents = new QueueEvents('Paint');

// queueEvents.on('completed', ({ jobId }) => {
//   console.log('done painting');
// });

// queueEvents.on(
//   'failed',
//   ({ jobId, failedReason }) => {
//     console.error('error painting', jobId, failedReason);
//   },
// );

const { Configuration, OpenAIApi } = require("openai");
const { setDefaultResultOrder } = require("dns");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY 
});
const openai = new OpenAIApi(configuration);


async function generateResponse(prompt, codeRelated = false) {
  if (!prompt) {
    return;
  }
  let model = "gpt-4"
  //TODO( if input is code related, use davinci model)
  if (codeRelated) {
    model = "text-davinci-002"
  }
  try {
    const completion = await openai.createChatCompletion({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.data.choices[0].message.content.trim();
    return response;
  } catch (error) {
    console.error(error);
    return "OpenAI API down";
  }
}

async function getFunctionTestCases(code) {
  const prompt = `Please write test cases and test case code using Jest framework  for the following function:\n\n${code}\n\tesetcases:`;
  const message = await generateResponse(prompt);
  return message;
}

async function optimizeFunction(code) {
  const prompt = `Please optimize the following function:\n\n${code}\n\nOptimization:`;
  const message = await generateResponse(prompt);
  return message;
}


async function getFunctionDocumentation(code) {
  const prompt = `Please provide the documentation for the following function:\n\n${code}\n\nDocumentation:`;
  const message = await generateResponse(prompt);
  return message;
}


async function generateCoreReview(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const prompt = `Please provide the code review for the following code:\n\n${fileContent}\n\n`;
  const message = await generateResponse(prompt);
  
  fs.writeFileSync(`Codereview-${filePath}`, message, (err) => {
    if (err) throw err;
    // console.log(`All functions updated successfully in ${filePath}`);
  });

  return message;
}


function getFunctionCodeBlock(sourceCode, functionNode) {
  const startLine = functionNode.loc.start.line - 1;
  const endLine = functionNode.loc.end.line - 1;
  return sourceCode.split('\n').slice(startLine, endLine).join('\n');
}


function getFunctionNames(code) {
  const functionNames = new Set();
  let match;

  while ((match = functionRegex.exec(code))) {
    functionNames.add(match[1]);
  }

  while ((match = arrowFunctionRegex.exec(code))) {
    functionNames.add(match[1]);
  }

  return Array.from(functionNames).filter((name) => /^[a-z]/.test(name));
}

// not using this function
const createNewFile = async (functionName, code) => {
  const functionRegex = new RegExp(`(?:function|async)\\s+${functionName}\\s*\\(|const\\s+${functionName}\\s*=\\s*(?:\\((?:.|\\s)+?\\)|${arrowFunctionRegex.source})\\s*=>`);
  const startIndex = code.search(functionRegex);
  if (startIndex === -1) {
    console.error(`Function ${functionName} not found`);
    return;
  }
  
    // add a commented line above the function
    const commentedLine = '// This is a commented line\n';
    const updatedCode = code.slice(0, startIndex) + commentedLine + code.slice(startIndex);
  
    let openBracesCount = 0;
    let endIndex;
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        openBracesCount++;
      } else if (code[i] === '}') {
        openBracesCount--;
        if (openBracesCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
  
    if (typeof endIndex === 'undefined') {
      console.error(`Function ${functionName} is not properly formatted`);
      return;
    }
  
    const functionBlock = code.slice(startIndex, endIndex + 1);
    const updatedCodeWithFunctionBlock = updatedCode.slice(0, startIndex + commentedLine.length) + functionBlock + updatedCode.slice(endIndex + 1);
  
    fs.writeFile("codereview-result.js", updatedCodeWithFunctionBlock, (err) => {
      if (err) throw err;
      console.log(`Function ${functionName} updated successfully`);
    });
  
}


async function readAllFunctionsFromFile(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const functionNames = getFunctionNames(fileContent);
  for (const functionName of functionNames) {
    const functionRegex = new RegExp(`async\\s+function\\s+${functionName}\\s*\\(|function\\s+${functionName}\\s*\\(|const\\s+${functionName}\\s*=\\s*(?:\\((?:.|\\s)+?\\)|${arrowFunctionRegex.source})\\s*=>`);

    const startIndex = fileContent.search(functionRegex);
    if (startIndex === -1) {
      console.error(`Function ${functionName} not found`);
      continue;
    }

    let openBracesCount = 0;
    let endIndex;
    for (let i = startIndex; i < fileContent.length; i++) {
      if (fileContent[i] === '{') {
        openBracesCount++;
      } else if (fileContent[i] === '}') {
        openBracesCount--;
        if (openBracesCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (typeof endIndex === 'undefined') {
      console.error(`Function ${functionName} is not properly formatted`);
      continue;
    }

    const functionBlock = fileContent.slice(startIndex, endIndex + 1);
    console.log("------Updating the function-------", functionName);

    const documentation = await getFunctionDocumentation(functionBlock);
    // const optimization = await optimizeFunction(functionBlock);
    const functionHeader = `/**\n * ${documentation}\n */`;
    
    fileContent = fileContent.slice(0, startIndex) + functionHeader + '\n' + functionBlock + fileContent.slice(endIndex + 1);
  }

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) throw err;
    console.log(`All functions updated successfully in ${filePath}`);
  });

  return functionNames
}

async function readFunctionsFromFile(filePath, functionNames, isDocumentation) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  for (const functionName of functionNames) {
    const functionRegex = new RegExp(`(?:export\\s+)?async\\s+function\\s+${functionName}\\s*\\(|(?:export\\s+)?function\\s+${functionName}\\s*\\(|(?:export\\s+)?const\\s+${functionName}\\s*=\\s*(?:\\((?:.|\\s)+?\\)|${arrowFunctionRegex.source})\\s*=>`);

    const startIndex = fileContent.search(functionRegex);
    if (startIndex === -1) {
      console.error(`Function ${functionName} not found`);
      continue;
    }

    let openBracesCount = 0;
    let endIndex;
    for (let i = startIndex; i < fileContent.length; i++) {
      if (fileContent[i] === '{') {
        openBracesCount++;
      } else if (fileContent[i] === '}') {
        openBracesCount--;
        if (openBracesCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (typeof endIndex === 'undefined') {
      console.error(`Function ${functionName} is not properly formatted`);
      continue;
    }

    const functionBlock = fileContent.slice(startIndex, endIndex + 1);
    console.log(`------Generating ${isDocumentation ? "Description" : "Test code "} for the function-------`, functionName);

    if (isDocumentation) {
      const documentation = await getFunctionDocumentation(functionBlock);
      // const optimization = await optimizeFunction(functionBlock);
      const functionHeader = `/**\n ${documentation}\n\n */`;
    
      fileContent = fileContent.slice(0, startIndex) + functionHeader + '\n' + functionBlock + fileContent.slice(endIndex + 1);
    } else {
      const testCases = await getFunctionTestCases(functionBlock);
      const functionHeader = `/**\n${testCases}\n\n */`;
      
      console.log(`------Updating ${isDocumentation ? "Description" : "Test code "} to file-------`, filePath);

      fileContent = fileContent.slice(0, startIndex) + functionHeader + '\n' + functionBlock + fileContent.slice(endIndex + 1);
    }
  }
  
  fs.writeFile(filePath, fileContent, (err) => {
    if (err) throw err;
    // console.log(`All functions updated successfully in ${filePath}`);
  });

  return functionNames
}

async function readFunctionsFromFolder(folderPath) {
  const files = fs.readdirSync(folderPath);
  const jsFiles = files.filter(file => ['.js', '.ts'].includes(path.extname(file)));
  const functions = jsFiles.flatMap(jsFile => readAllFunctionsFromFile(path.join(folderPath, jsFile)));
  return functions;
}

async function generateTestCases(filename, functionNames) {
   await readFunctionsFromFile(filename, functionNames, false)
}

async function generateDocumentation(filename, functionNames) {
  await readFunctionsFromFile(filename, functionNames, true)
}


function welcomeMessage() {
  console.log(`
  ${chalk.red.bold('Commands:')}
  ${chalk.blue.bold('- lint-code <filename.extension>')}
  ${chalk.blue.bold('- optimize-code <filename.extension>')}
  ${chalk.blue.bold('- refactor-code <filename.extension>')}
  ${chalk.blue.bold('- review-code <filename.extension>')}
  ${chalk.blue.bold('- generate-error-handling <filename.extension>')}
  ${chalk.blue.bold('- generate-docs <filename.extension>')}
  ${chalk.blue.bold('- generate-integration-tests <filename.extension>')}
  ${chalk.blue.bold('- generate-unit-tests <filename.extension>')}
  ${chalk.blue.bold('- generate-performance-profiling <filename.extension>')}
  ${chalk.blue.bold('- scan-code-bugs <filename.extension>')}
  ${chalk.blue.bold('- scan-code-securityaudit <filename.extension>')}
  ${chalk.blue.bold('- syscmd <Any system command that you usually run in the terminal>')}

  ${chalk.red.bold('Multi line text input:')}
  ${chalk.blue.bold('- Type .editor and press enter to enter \'editor mode\'')}
  ${chalk.blue.bold('- Type or paste your multiline code or text into the editor')}
  ${chalk.blue.bold('- When you\'re done, press Ctrl + D to exit editor mode, and the ChatGPT response will be printed in the console')}
 
  ${chalk.green.bold('For all other commands or texts, the ChatGPT response will be printed in the console.')}
  ${chalk.green.bold('Try: What are some tips to keep myself motivated for coding today?')}
  `);
}
welcomeMessage();

// Spawn a new process for the Rails console
// const railsConsole = spawn('rails', ['c']);
// const railsConsole = spawn('python3');



// const db = new PouchDB('mydb', { adapter: 'memory' });

// db.put({
//   _id: 'mydoc',
//   title: 'Heroes'
// }).then(function (response) {
//   // handle response
//   console.log("---------------",response);
// }).catch(function (err) {
//   console.log(err);
// });

const completerFunc = (linePartial, callback) => {
  const dir = path.dirname(linePartial);
  const prefix = path.basename(linePartial);
  fs.readdir(dir, (err, files) => {
    if (err) {
      callback([]);
    } else {
      // const matches = files.filter(f => f.startsWith(prefix));
      callback(null, '');
    }
  });
};


  

/**
Here are the test cases and the Jest test code for the `getContentType` function:

Test Cases:
1. Test with a JSON string response.
2. Test with a non-JSON string response.
3. Test with an empty string response.
4. Test with null response.

Jest Test Code:

```javascript
const { getContentType } = require('./getContentType');

describe('getContentType Tests', () => {
  test('Should return json for JSON string response', () => {
    const response = JSON.stringify({ key: 'value' });
    const result = getContentType(response);
    expect(result).toBe('json');
  });

  test('Should return text for non-JSON string response', () => {
    const response = 'This is a plain text response';
    const result = getContentType(response);
    expect(result).toBe('text');
  });

  test('Should return text for an empty string response', () => {
    const response = '';
    const result = getContentType(response);
    expect(result).toBe('text');
  });

  test('Should return null for a null response', () => {
    const response = null;
    const result = getContentType(response);
    expect(result).toBe(null);
  });
});
```

And your `getContentType` function should be exported in the module as below:

```javascript
function getContentType(response) {
  if (response) {
    const dataString = response.toString().trim();
    if (dataString.startsWith('{') && dataString.endsWith('}')) {
      return 'json';
    }
    return 'text';
  }
  return null;
}

module.exports = {
  getContentType
};
```

Now you can run `jest` in your terminal to test the `getContentType` function using the provided test code.

 */
function getContentType(response) {
  if (response) {
    const dataString = response.toString().trim();
    if (dataString.startsWith('{') && dataString.endsWith('}')) {
      return 'json';
    }
    return 'text';
  }
  return null;
}

function containsCodeBlock(text) {
  return /```[\s\S]+```/.test(text);
}

function formatCodeBlock(text) {
  const codeBlockRegex = /```([\s\S]+)```/;
  const match = text.match(codeBlockRegex);
  if (match) {
    const codeBlock = match[1];

    if (codeBlock) {
      const language = codeBlock.trim().split(/\s+/)[0];

      let parser = 'babel';
      if (language && language.length > 1) {
        parser = language.includes("javascript") ? 'babel' : `prettier/parser-${language}`;
      }
      //TODO: const formattedCodeBlock = prettier.format(codeBlock, { parser: parser });
      return text.replace(codeBlockRegex, chalk.green(codeBlock));
    } else {
      return text;
    }
  }
  return text;
}

// Create REPL instance
const gptCli = repl.start({
  prompt: "gpt-console> ",
  useColors: true,
  // completer: completerFunc
});


// function setupConnection() {
//   conn.on('ready', () => {
//     console.log('SSH connection established.');
//     conn.shell((err, stream) => {
//       if (err) throw err;

      
//       // Forward input/output streams to the remote shell
//       if (process.stdin.isTTY) {
//         process.stdin.pipe(stream);
//         stream.pipe(process.stdout);
//         stream.stderr.pipe(process.stderr);
//       }
     
     
//     });
//   }).connect({
//     host: '146.190.120.104',
//     port: 22,
//     username: 'root',
//     password: 'vwYvh6WN5@auto'
//   });
// }



// Override default evaluator function
gptCli.eval = async (input, context, filename, callback) => {
  // if (evaluatedInputs.has(input)) {
  //   return callback(null, "");
  // }

  // setupConnection();
    // Execute input on remote machine
  // conn.on('ready', () => {
  //   console.log('SSH connection established.');
  //   conn.shell((err, stream) => {
  //     if (err) throw err;
  //     // Forward input/output streams to the remote shell
  //     process.stdin.pipe(stream);
  //     stream.pipe(process.stdout);
  //     stream.stderr.pipe(process.stderr);
  //   });

  //   // Forward stdin and stdout to the remote machine
  //   // process.stdin.pipe(conn.shell('bash')).pipe(process.stdout);
  
  // }).connect({
  //   host: '146.190.120.104',
  //   port: 22,
  //   username: 'root',
  //   password: 'vwYvh6WN5@auto'
  // });
  const tokens = input.split(" ");
  const command = tokens[0];
  switch (command.trim()) {
    case "c":
      const repoUrl = tokens[1];
      if (!repoUrl) {
        callback(new Error(`Repository Url is missing. Usage: c <githuburl>`));
        return;
      }
      exec(`git clone ${repoUrl}`, (error, stdout, stderr) => {
        console.log(`checking out  ${repoUrl}`);
        if (error) {
          callback(new Error(`Error checking out code: ${stderr}`));
          return;
        }
        callback(null, "Code checked out successfully");
      });
      break;
    case "f":
      const filename = tokens[1];
      if (!filename) {
        callback(new Error(`Filename is missing. Usage: f <filename>`));
        return;
      }
      exec(`touch ${filename}`, (error, stdout, stderr) => {
        if (error) {
          callback(new Error(`Error creating file: ${stderr}`));
          return;
        } else {
          callback(null, `File ${filename} created successfully`);
        }
      });
      break;
    case "codereview-allfiles":
      const functions = await readFunctionsFromFolder(process.cwd());
      break;
    case "codereview":
      const inputArgs = input.split(" ")
      if (inputArgs.length != 2) { 
        callback(new Error(`Wrong Input. Usage: codereview <filename.extension>`));
        return;
      }
    
      const codereviewSpinner = spinners.dots;
      const codereviewSpinnerInterval = setInterval(() => {
        process.stdout.write(`\r${codereviewSpinner.frames[codereviewSpinner.interval % codereviewSpinner.frames.length]}`);
        codereviewSpinner.interval++;
      }, codereviewSpinner.frameLength);
      const response = await generateCoreReview(inputArgs[1].trim());

      let formattedResponse;
      if (response) {
        if (containsCodeBlock(response)) {
          formattedResponse = formatCodeBlock(response);
        } else {
          formattedResponse = response;
        }
      }
      formattedResponse = chalk.blue.bold('\nResponse:\n') + formattedResponse + '\n\n' + chalk.blue.bold(`\nOutput also written to file Codereview-${inputArgs[1].trim()}:\n`);
  
      clearInterval(codereviewSpinnerInterval);
      process.stdout.write('\r');
      // process.stdout.write('\033[0G');
      process.stdout.write('\x1B[0G');
      console.log(formattedResponse);
      callback(null, "");
      break;
    case "generate-testcases":
      if (input.split(" ").length < 3) { 
        callback(new Error(`Wrong Input. Usage: generate-testcases <filename.extension> functionname1 functionname2`));
        return;
      }
      const unittestFileName = input.split(" ")[1]
      const testcasesFunctions = input.split(" ").slice(2).map(func => func.trim());
      const testCaseSpinner = spinners.dots;
      const testCaseInterval = setInterval(() => {
        process.stdout.write(`\r${testCaseSpinner.frames[testCaseSpinner.interval % testCaseSpinner.frames.length]}`);
        testCaseSpinner.interval++;
      }, testCaseSpinner.frameLength);

      await generateTestCases(unittestFileName, testcasesFunctions);
      clearInterval(testCaseInterval);
      process.stdout.write('\r');
      // process.stdout.write('\033[0G');
      process.stdout.write('\x1B[0G');

      break;
    case "generate-doc":
      if (input.split(" ").length < 3) { 
        callback(new Error(`Wrong Input. Usage: generate-doc <filename.extension> functionname1 functionname2`));
        return;
      }
      const codereviewFileName = input.split(" ")[1]
      const codereviewFunctions = input.split(" ").slice(2).map(func => func.trim());
      const spinner = spinners.dots;
      const interval = setInterval(() => {
        process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
        spinner.interval++;
      }, spinner.frameLength);

      await generateDocumentation(codereviewFileName, codereviewFunctions);
      clearInterval(interval);
      process.stdout.write('\r');
      // process.stdout.write('\033[0G');
      process.stdout.write('\x1B[0G');

      callback(null, "Done");
      break;
    case "og":
      const sytemcommand = input.split(" ").slice(1).join(" ");
      if (!sytemcommand) {
        callback(new Error(`command missing. Usage: og <sytem command>`));
        return;
      }
      exec(`${sytemcommand}`, (error, stdout, stderr) => {
        if (error) {
          callback(new Error(`Error executing ${sytemcommand}: ${stderr}`));
          return;
        } else {
          process.stdout.write(stdout);
        }
      });
      break;
    case 'ast':      
      try {
        console.log("===theutilfuncs=====", codescan.func1());
        console.log("===github=====",github.func1());
        console.log("===documentation=====",documentation.func1());
        const currentDirectory = __dirname;

        dependencyGraph.getDependencyJson(currentDirectory)
        .then(dependencies => {
          console.log('Dependency JSON:', dependencies);
        });

        let fileContent = fs.readFileSync('cli.js', 'utf8');
        // Remove the shebang line if present
        const cleanFileContent = fileContent.replace(/^#!.*/, '');

        // Parse the code into an AST
        const ast = recast.parse(cleanFileContent);

        // Visitor to remove comments and stale code
        const visitor = {
          visitNode(path) {
            // Remove single-line comments
            if (path.node.comments && path.node.comments.length > 0) {
              path.node.comments = path.node.comments.filter(comment => comment.type !== 'Line');
            }
            this.traverse(path);
          },
          visitBlock(path) {
            // Remove block comments
            path.replace();
            this.traverse(path);
          },
          visitEmptyStatement(path) {
            // Remove empty statements
            path.prune();
            return false;
          },
          visitProgram(path) {


            // Remove end-of-file comments
            if (path.node.comments) {
              path.node.comments = path.node.comments.filter(comment => !comment.trailing);
            }

            const body = path.get('body');
            if (body && body.length > 0) {
              // Find the last index of `ExpressionStatement`
              let lastIndex = -1;
              for (let i = body.length - 1; i >= 0; i--) {
                const node = body[i];
                if (node.type === 'ExpressionStatement') {
                  lastIndex = i;
                  break;
                }
              }

              if (lastIndex !== -1) {
                // Remove all nodes after the last `ExpressionStatement`
                path.node.body = path.node.body.slice(0, lastIndex + 1);
              }
            }

            if (path.node.comments && path.node.comments.length > 0) {
              // Remove top-level comments
              path.node.comments = [];
            }

            this.traverse(path);
            
            // const body = path.get('body');
            // if (body && body.length > 0) {
            //   // Find the last node that matches `ExpressionStatement` followed by `};`
            //   let lastIndex = -1;
            //   for (let i = body.length - 1; i >= 0; i--) {
            //     const node = body[i];
            //     if (
            //       node.type === 'ExpressionStatement' &&
            //       node.expression.type === 'Literal' &&
            //       typeof node.expression.value === 'string' &&
            //       node.expression.value.endsWith('};')
            //     ) {
            //       lastIndex = i;
            //       break;
            //     }
            //   }
      
            //   if (lastIndex !== -1) {
            //     // Remove all nodes after the last `};`
            //     path.node.body = path.node.body.slice(0, lastIndex + 1);
            //   }
            // }
      
            // if (path.node.comments && path.node.comments.length > 0) {
            //   // Remove top-level comments
            //   path.node.comments = [];
            // }
      
            // this.traverse(path);


            
          },
          // Add more conditions for removing other types of stale code
        };


        // Apply the visitor to remove comments and stale code
        recast.visit(ast, visitor);

        // Generate the modified code
        const modifiedCode = recast.print(ast).code;

        console.log('=====output=======');
        // console.log(modifiedCode.replace(/(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/g, ''));

        fs.writeFileSync(`nocomments.js`, modifiedCode.replace(/(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/g, ''), (err) => {
          if (err) throw err;
          // console.log(`All functions updated successfully in ${filePath}`);
        });
      
        // console.log(modifiedCode);
            

      } catch (error) {
        console.error('An error occurred while reading or parsing the file:');
        console.error(error);
      }
      break;
    case "exit":
    case "quit":
    case "q":
    case '\u0003':
      process.exit();
      break;
    
    default:
      // (async () => { 
       
      //   // if (input === '\u0003') { // '\u0003' represents the Ctrl+C signal
      //   //   console.log('API call canceled.');
      //   //   callback(null, "");
      //   //   return;
      //   // }
      //   const spinner = spinners.dots;
      //   const interval = setInterval(() => {
      //     process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
      //     spinner.interval++;
      //   }, spinner.frameLength);
      //   const response = await generateResponse(input);        
      //   clearInterval(interval);
      //   process.stdout.write('\r');
        

      //   let formattedResponse;
      //   if (response) {
      //     const contentType = getContentType(response);
      
      //     switch (contentType) {
      //       case 'json':
      //         formattedResponse = prettier.format(response, { parser: 'json' });
      //         break;
      //       case 'text':
      //         if (containsCodeBlock(response)) {
      //           formattedResponse = formatCodeBlock(response);
      //         } else {
      //           formattedResponse = response;
      //         }
      //         break;
      //       default:
      //         formattedResponse = response;
      //     }
      
      //     formattedResponse = chalk.blue.bold('\nResponse:\n') + formattedResponse;
      //   } else {
      //     formattedResponse = chalk.yellow('No response');
      //   }
      
      //   console.log(formattedResponse);
      //   callback(null, "");
      // })();
      // break;
  }
};






// asdf
// asdffa
// setDefaultResultOrderasd
// falsesdf
// a sd
// falsesdfasd
// falsesdfad





























// create an developer autonomous ai worker that can do the following:

// learning:

// 1. reads all the files of current working directory
// 2. creates indexes for all the functions and files using embeddings and saves them to pinecone
// 3. reads non code files and creates embeddings for them and saves them to pinecone
// 4. reads the pull requests(pull request name, description, code added) and create embeddings for them and saves them to pinecone
// 5. reads last 100 commits(commit names, code) and creates embeddings for them and saves them to pinecone
// 6. use code analsys tool to find out the architecture of the code and save it to pinecone


// It should be able to pause and resume, sharable across the teams 


// defining the task: 

// 1. takes a description of the task as input
//   - ask atleast 5 clarifying questions
//   - ask atleast 5 questions to developer expert openion 

// Planning

// 1. create a plan to get above task done
//   - break down the taks, create sub tasks
//   - create a plan for each subtask
//   - execute the plan for each subtask
//     - 
   

// coding and testing 

// 2. create a code for each subtask 
//   - write test cases for each subtask
//   - execute the code in local machine and test it
//   - based on the output modify the code
//   - if the code is not working, change the plan, use different context

     





// You are Story - GPT, an AI designed to autonomously write stories.



// Your decisions must always be made independently without seeking user assistance.
// Play to your strengths as an LLM and pursue simple strategies.

  
  
// GOALS:
// 1. write a short story about flowers

// Constraints:
// 1. 4000 word limit for short term memory. Your short term memory is short, so immediately save important information to files.
// 2. If you are unsure how you previously did something or want to recall past events, thinking about similar events will help you remember.
// 3. No user assistance
// 4. Exclusively use the commands listed in double quotes e.g. "command name"

// Commands:
// 1. Google Search: "google", args: "input": "<search>"
// 2. Browse Website: "browse_website", args: "url": "<url>", "question": "<what_you_want_to_find_on_website>"
// 3. Start GPT Agent: "start_agent", args: "name": "<name>", "task": "<short_task_desc>", "prompt": "<prompt>"
// 4. Message GPT Agent: "message_agent", args: "key": "<key>", "message": "<message>"
// 5. List GPT Agents: "list_agents", args:
// 6. Delete GPT Agent: "delete_agent", args: "key": "<key>"
// 7. Clone Repository: "clone_repository", args: "repository_url": "<url>", "clone_path": "<directory>"
// 8. Write to file: "write_to_file", args: "file": "<file>", "text": "<text>"
// 9. Read file: "read_file", args: "file": "<file>"
// 10. Append to file: "append_to_file", args: "file": "<file>", "text": "<text>"
// 11. Delete file: "delete_file", args: "file": "<file>"
// 12. Search Files: "search_files", args: "directory": "<directory>"
// 13. Evaluate Code: "evaluate_code", args: "code": "<full_code_string>"
// 14. Get Improved Code: "improve_code", args: "suggestions": "<list_of_suggestions>", "code": "<full_code_string>"
// 15. Write Tests: "write_tests", args: "code": "<full_code_string>", "focus": "<list_of_focus_areas>"
// 16. Execute Python File: "execute_python_file", args: "file": "<file>"
// 17. Generate Image: "generate_image", args: "prompt": "<prompt>"
// 18. Send Tweet: "send_tweet", args: "text": "<text>"
// 19. Do Nothing: "do_nothing", args:
// 20. Task Complete (Shutdown): "task_complete", args: "reason": "<reason>"

// Resources:
// 1. Internet access for searches and information gathering.
// 2. Long Term memory management.
// 3. GPT-3.5 powered Agents for delegation of simple tasks.
// 4. File output.

// Performance Evaluation:
// 1. Continuously review and analyze your actions to ensure you are performing to the best of your abilities.
// 2. Constructively self-criticize your big-picture behavior constantly.
// 3. Reflect on past decisions and strategies to refine your approach.
// 4. Every command has a cost, so be smart and efficient. Aim to complete tasks in the least number of steps.

// You should only respond in JSON format as described below 
// Response Format: 
// {
//     "thoughts": {
//         "text": "thought",
//         "reasoning": "reasoning",
//         "plan": "- short bulleted\n- list that conveys\n- long-term plan",
//         "criticism": "constructive self-criticism",
//         "speak": "thoughts summary to say to user",
//     },
//     "command": {"name": "command name", "args": {"arg name": "value"}},
// }

// Ensure the response can be parsed by Python json.loads