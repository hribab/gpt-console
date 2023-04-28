#!/usr/bin/env node

const repl = require("repl");
const { exec } = require("child_process");
const spinners = require("cli-spinners"); // TODO: use this to show spinner while waiting for response
const fs = require('fs');
const path = require('path');
const functionRegex = /function\s+(\w+)\s*\(/gm;
const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\((?:\w+(?:,\s*\w+)*)?\)\s*=>/gm;
const { completer } = require('readline');
const chalk = require('chalk');
const prettier = require('prettier');

const { Configuration, OpenAIApi } = require("openai");
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
  const completion = await openai.createChatCompletion({
    model: model,
    messages: [{role: "user", content: prompt}],
  });

  const response = completion.data.choices[0].message.content.trim();
  return `${response}`
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
  ${chalk.blue.bold('- generate-testcases <filename.extension> functionname1 functionname2')}
  ${chalk.blue.bold('- generate-doc <filename.extension> functionname1 functionname2')}
  ${chalk.blue.bold('- codereview <filename.extension>')}
  
  ${chalk.red.bold('Multi line Commands:')}
  ${chalk.blue.bold('- Type .editor and press enter to enter \'editor mode\'')}
  ${chalk.blue.bold('- Type or paste your multiline code or text into the editor')}
  ${chalk.blue.bold('- When you\'re done, press Ctrl + D to exit editor mode, and the ChatGPT response will be printed in the console')}
 
  ${chalk.green.bold('For all other commands or texts, the ChatGPT response will be printed in the console.')}
  ${chalk.green.bold('Try: What are some tips to keep myself motivated for coding today?')}
  `);
}
welcomeMessage();

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

// Create REPL instance
const gptCli = repl.start({
  prompt: "gpt-console> ",
  useColors: true,
  completer: completerFunc
});
  

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


// Override default evaluator function
gptCli.eval = async (input, context, filename, callback) => {
  if (!input || (input && input.trim() === "")) {
    return callback(null, ""); 
  }
 
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
      process.stdout.write('\033[0G');
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
      process.stdout.write('\033[0G');
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
      process.stdout.write('\033[0G');
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
    
    default:
      (async () => { 
        // let loader = setInterval(() => {
        //   process.stdout.write(".");
        // }, 100);
        const spinner = spinners.dots;
        const interval = setInterval(() => {
          process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
          spinner.interval++;
        }, spinner.frameLength);
        const response = await generateResponse(input);        
        clearInterval(interval);
        process.stdout.write('\r');
        

        let formattedResponse;
        if (response) {
          const contentType = getContentType(response);
      
          switch (contentType) {
            case 'json':
              formattedResponse = prettier.format(response, { parser: 'json' });
              break;
            case 'text':
              if (containsCodeBlock(response)) {
                formattedResponse = formatCodeBlock(response);
              } else {
                formattedResponse = response;
              }
              break;
            default:
              formattedResponse = response;
          }
      
          formattedResponse = chalk.blue.bold('\nResponse:\n') + formattedResponse;
        } else {
          formattedResponse = chalk.yellow('No response');
        }
      
        console.log(formattedResponse);
        callback(null, "");
      })();
      break;
  }
};
