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
        ${consoleFormat('Your Personal Autonomous Agents:', 'red')}
        ${consoleFormat('- Bird: Seamlessly manages your Twitter, engaging in Tweets and Replies', 'blue')}
        ${consoleFormat('- Pixie: Crafts sophisticated landing pages using ReactJS tailored to your needs', 'blue')}
        ${consoleFormat('- Chip: Capable of answering any code-related questions in your stack', 'blue')}
    `);
}

function birdHelpMessage() {
    console.log(`     
        ${consoleFormat('How to use Bird?:', 'red')}
        ${consoleFormat('bird start', 'blue')}
        ${consoleFormat('bird stop', 'blue')}
        ${consoleFormat('bird status', 'blue')}
    `);
}

function pixieHelpMessage() {
    console.log(`     
        ${consoleFormat('How to use Pixie?:', 'red')}
        ${consoleFormat('pixie start "your business description here"', 'blue')}
        ${consoleFormat('pixie update "update to existing page"', 'blue')}
        ${consoleFormat('pixie stop', 'blue')}
        ${consoleFormat('pixie status', 'blue')}
    `);
}

function chipHelpMessage() {
    console.log(`     
        ${consoleFormat('Your Personal Autonomous Agents:', 'red')}
        ${consoleFormat('- Bird: Seamlessly manages your Twitter, engaging in Tweets and Replies', 'blue')}
        ${consoleFormat('- Pixie: Crafts sophisticated landing pages using ReactJS tailored to your needs', 'blue')}
        ${consoleFormat('- Chip: Capable of answering any code-related questions in your stack:', 'blue')}${consoleFormat('Coming soon..', 'yellow')}
    `);
}

module.exports = {
    runSpinnerAndSaveResponse,
    runSpinnerAndReturnResponse,
    completerFunc,
    welcomeMessage,
    birdHelpMessage,
    pixieHelpMessage,
    chipHelpMessage
}