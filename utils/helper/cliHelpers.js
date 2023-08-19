const spinners = require("cli-spinners");
const path = require('path');
const fs = require('fs');

const { generateResponse } = require("../api/apiCall");
const { saveResponseToNewFile } = require("../scripts/helperScripts");
const { consoleFormat, consoleFormatPlain } = require('../scripts/consoleFormatting')

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
        ${consoleFormat('Your Personal Autonomous Agents:', 'green')}
        ${consoleFormat('- Bird: Seamlessly manages your Twitter, engaging in Tweets and Replies', 'blue')}
        ${consoleFormat('- Pixie: Crafts sophisticated landing pages using ReactJS tailored to your needs', 'blue')}
        ${consoleFormat('- Chip: Capable of answering any code-related questions in your stack:', 'blue')}${consoleFormat('Coming soon..', 'yellow')}
        
        ${consoleFormat('Raw, unfinished, and alive with potential. 🛠️ Dive in, play, but remember, we\'re still in the lab!', 'red')}
        
        ${consoleFormatPlain('To quit GPT Console, just type q or press Ctrl+C.', 'gray')}
        ${consoleFormatPlain("Not into agents? No worries, just type your prompt. Let's chat! 💬", 'gray')}
    `);
}

function birdHelpMessage() {
    console.log(`     
        ${consoleFormat('How to use Bird?:', 'green')}
        ${consoleFormat('bird start', 'blue')} 
        ${consoleFormat('bird start "your requirement prompt"', 'blue')} 
        ${consoleFormat('bird stop', 'blue')} 
    `);
}

function pixieHelpMessage() {
    console.log(`     
        ${consoleFormat('How to use Pixie?:', 'green')}
        ${consoleFormat('pixie start "your business description here"', 'blue')}
        ${consoleFormat('pixie update "update to existing page"', 'blue')}
    `);
}

function chipHelpMessage() {
    console.log(`     
        ${consoleFormat('How to use Chip?', 'green')}
        ${consoleFormat('chip learn', 'blue')}
        ${consoleFormat('chip "Your question"', 'blue')}

        ${consoleFormat("Coming soon: Most is complete, a few features pending. Stay tuned!", 'red')}
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