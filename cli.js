#!/usr/bin/env node

const repl = require("repl");
const { exec } = require("child_process");
const spinners = require("cli-spinners"); // TODO: use this to show spinner while waiting for response
const fs = require('fs');
const path = require('path');
const functionRegex = /function\s+(\w+)\s*\(/gm;
const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\((?:\w+(?:,\s*\w+)*)?\)\s*=>/gm;
const { ESLint } = require('eslint');
const parser = require('@babel/parser');
const traverse = require('babel-traverse').default;

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


async function listFunctions(file) {
  const eslint = new ESLint({});
  const results = await eslint.lintFiles([file]);
  
  for (const result of results) {
    const sourceCode = result.sourceCode.text;
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'] // Add any additional plugins required for your code
    });

    for (const message of result.messages) {
      if (message.ruleId === 'no-inner-declarations') {
        const functionNode = findFunctionNode(ast, message.line);
        if (functionNode) {
          console.log(`Function "${message.message}" declared at line ${message.line}:`);
          console.log(getFunctionCodeBlock(sourceCode, functionNode));
        }
      }
    }
  }
}


function findFunctionNode(ast, line) {
  let functionNode;
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.loc.start.line === line) {
        functionNode = path.node;
        path.stop();
      }
    }
  });
  return functionNode;
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
  
    console.log("-------updatedCodeWithFunctionBlock-------", updatedCodeWithFunctionBlock);
    fs.writeFile("codereview-result.js", updatedCodeWithFunctionBlock, (err) => {
      if (err) throw err;
      console.log(`Function ${functionName} updated successfully`);
    });
  
}


async function readFunctionsFromFile(filePath) {
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
    const optimization = await optimizeFunction(functionBlock);
    const functionHeader = `/**\n * ${documentation}\n * Optimization: ${optimization}\n */`;
    
    fileContent = fileContent.slice(0, startIndex) + functionHeader + '\n' + functionBlock + fileContent.slice(endIndex + 1);
  }

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) throw err;
    console.log(`All functions updated successfully in ${filePath}`);
  });

  

  return functionNames
}


async function readFunctionsFromFolder(folderPath) {
  const files = fs.readdirSync(folderPath);
  const jsFiles = files.filter(file => ['.js', '.ts'].includes(path.extname(file)));
  const functions = jsFiles.flatMap(jsFile => readFunctionsFromFile(path.join(folderPath, jsFile)));
  return functions;
}


function welcomeMessage() {
  console.log(
    "Type .editor and press enter. This will put the console in 'editor mode'.\n" +
    "Type or paste your multiline code or text into the console.\n" +
    "When you're done entering your code, press Ctrl + D to exit editor mode"
  );
}
welcomeMessage();

// Create REPL instance
const gptCli = repl.start({
  prompt: "gpt-console> ",
});


  
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
    case "codereview":
      const functions = await readFunctionsFromFolder(process.cwd());
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
        
        // process.stdout.write("\n"); // flush stdout buffer
        // clearInterval(loader); // clear loader
        process.stdout.write('\033[0G'); // move cursor to beginning of line
        callback(null, response);
      })();
      break;
  }
};
