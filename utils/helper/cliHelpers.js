const spinners = require("cli-spinners");
const path = require('path');
const fs = require('fs');

const { generateResponse } = require("../api/apiCall");
const { saveResponseToNewFile } = require("../scripts/helperScripts");
const { consoleFormat } = require('../scripts/consoleFormatting')

async function runSpinnerAndSaveResponse(finalPrompt, fileName, operation) {
    const spinner = spinners.dots;    
    const interval = setInterval(() => {
        process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
        spinner.interval++;
    }, spinner.frameLength);
  
    const response = await generateResponse(finalPrompt);
    await saveResponseToNewFile(response, `${operation}_${fileName}`);
    clearInterval(interval);
    process.stdout.write('\r');
}

async function runSpinnerAndReturnResponse(finalPrompt, fileName, operation) {
    const spinner = spinners.dots;    
    const interval = setInterval(() => {
        process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
        spinner.interval++;
    }, spinner.frameLength);
  
    const response = await generateResponse(finalPrompt);
    
    clearInterval(interval);
    process.stdout.write('\r');
    return response;
}

function completerFunc(linePartial, callback) {
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

function welcomeMessage() {
    console.log(`
        ${consoleFormat('Commands:', 'red')}
        ${consoleFormat('- lint-code <filename.extension>', 'blue')}
        ${consoleFormat('- optimize-code <filename.extension>', 'blue')}
        ${consoleFormat('- refactor-code <filename.extension>', 'blue')}
        ${consoleFormat('- review-code <filename.extension>', 'blue')}
        ${consoleFormat('- error-handling <filename.extension>', 'blue')}
        ${consoleFormat('- generate-docs <filename.extension>', 'blue')}
        ${consoleFormat('- unit-tests <filename.extension>', 'blue')}
        ${consoleFormat('- performance-profiling <filename.extension>', 'blue')}
        ${consoleFormat('- scan-bugs <filename.extension>', 'blue')}
        ${consoleFormat('- scan-security <filename.extension>', 'blue')}
        ${consoleFormat('- syscmd <Any system command that you usually run in the terminal>', 'blue')}
        
        ${consoleFormat('Multi line text input:', 'red')}
        ${consoleFormat('- Type .editor and press enter to enter \'editor mode\'', 'blue')}
        ${consoleFormat('- Type or paste your multiline code or text into the editor', 'blue')}
        ${consoleFormat('- When you\'re done, press Ctrl + D to exit editor mode, and the ChatGPT response will be printed in the console', 'blue')}
        
        ${consoleFormat('Autonomous Agents:', 'red')}
        ${consoleFormat('- fullstackdev', 'blue')}
        ${consoleFormat('- fullstackqa', 'blue')}
        ${consoleFormat('- sfdcqa', 'blue')}
        
        ${consoleFormat('For all other commands or texts, the ChatGPT response will be printed in the console.', 'green')}
        ${consoleFormat('Try: What are some tips to keep myself motivated for coding today?', 'green')}
    `);
}

module.exports = {
    runSpinnerAndSaveResponse,
    runSpinnerAndReturnResponse,
    completerFunc,
    welcomeMessage
}