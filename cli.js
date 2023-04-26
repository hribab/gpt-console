#!/usr/bin/env node

const repl = require("repl");
const { exec } = require("child_process");
const spinners = require("cli-spinners"); // TODO: use this to show spinner while waiting for response
const fs = require('fs');
const path = require('path');
const functionRegex = /function\s+(\w+)\s*\(/gm;
const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\((?:\w+(?:,\s*\w+)*)?\)\s*=>/gm;


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

async function readFunctionsFromFile(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const functionNames = getFunctionNames(fileContent);
  for (const functionName of functionNames) {
    
  
    const functionRegex = new RegExp(`function\\s+${functionName}\\s*\\(`);
    const startIndex = fileContent.search(functionRegex);
    if (startIndex === -1) {
      console.error(`Function ${functionName} not found`);
      return;
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
      return;
    }
  
    const functionBlock = fileContent.slice(startIndex, endIndex + 1);
    console.log(functionBlock);



    // let match;
    // while ((match = functionRegex.exec(fileContent))) {
    //   const functionName2 = match[1] || match[2];
    //   console.log("function name is", functionName2);
    //   const functionCode = `${functionName2} = ${match[0]}`;
    //   console.log("function code is", functionCode);

    //   const documentation = "ddd" //await getFunctionDocumentation(functionCode);
    //   const optimization = "ooo" //await optimizeFunction(functionCode);
    //   const functionHeader = `/**\n * ${documentation}\n * Optimization: ${optimization}\n */`;
    //   fileContent = fileContent.replace(new RegExp(`(function\\s+${functionName2}\\s*\\()|(const\\s+${functionName2}\\s*=\\s*\\()`, 'g'), `${functionHeader}$1$2`);
    // }
    
    
    // const regex = new RegExp(`(${functionName}\\s*=\\s*${arrowFunctionRegex.source})|(${functionRegex.source}\\s*${functionName}\\s*${arrowFunctionRegex.source})`);
    // console.log('regex:', regex);
    // const match = fileContent.match(regex);
    // console.log('match:', match);
    // const functionCode = `${functionName} = ${fileContent.match(new RegExp(`(${functionName}\\s*=\\s*${arrowFunctionRegex.source})|(${functionRegex.source}\\s*${functionName}\\s*${arrowFunctionRegex.source})`))[0]}`;
    // console.log("callling fucntion with code ====", functionName, "code is===", functionCode);

    // const documentation = await getFunctionDocumentation(functionCode);
    // const optimization = await optimizeFunction(functionCode);
    // const functionHeader = `/**\n * ${documentation}\n * Optimization: ${optimization}\n */`;
    // console.log("result is", functionHeader);
    // fileContent = fileContent.replace(new RegExp(`(function\\s+${functionName}\\s*\\()|(const\\s+${functionName}\\s*=\\s*\\()`, 'g'), `${functionHeader}$1$2`);
}
  return functionNames
}


const updateFile = async (functionName, code) => {
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
    fs.writeFile("updatefiled-result.js", updatedCodeWithFunctionBlock, (err) => {
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
    fileContent = fileContent.slice(0, startIndex) + "COMMENTED_LINE COMMENTED_LINE COMMENTED_LINE COMMENTED_LINE" + '\n' + functionBlock + fileContent.slice(endIndex + 1);
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
    case "functions":
      const functions = await readFunctionsFromFolder(process.cwd());
      console.log(functions);
      // process.stdout.write(functions);
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
