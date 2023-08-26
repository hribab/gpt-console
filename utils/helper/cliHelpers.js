const spinners = require("cli-spinners");
const path = require('path');
const fs = require('fs');
const http = require('http');
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const open = require('open');

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

function welcomeMessage(logginedUser) {
    console.log(`     
        ${consoleFormat('Your Personal Autonomous Agents:', 'cyan')}
        ${consoleFormat('- Bird: Seamlessly manages your Twitter, engaging in Tweets and Replies', 'blue')}
        ${consoleFormat('- Pixie: Generates sophisticated landing pages using ReactJS based on your prompts.', 'blue')}
        ${consoleFormat('- Chip: Capable of answering any code-related questions in your stack:', 'blue')}${consoleFormat('Coming soon..', 'yellow')}
        
        ${consoleFormat('Raw, unfinished, and alive with potential. Dive in, play, but remember, we\'re still in the lab!', 'red')}
        ${consoleFormatPlain('To quit GPT Console, just type q or press Ctrl+C.', 'gray')}
        ${consoleFormatPlain("Not into agents? No worries, just type your prompt.", 'gray')}

        ${!logginedUser ? consoleFormatPlain("Ready to explore? Enter 'login' to create or access your account.", 'cyan') : ''}
    `);
}

function alreadyLoggedInMessage(user) {
    console.log(`     
        ${consoleFormat(`Already logged in as ${user}`, 'green')}
    `);
}

function messageAndOpenLogin(callback) {
    const port = 8085;

    const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.statusCode = 200;
      // Set the CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*'); // You may want to restrict this to specific origins
      res.setHeader('Content-Type', 'text/plain');
      // Parse parameters from the URL
      const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;  
      const token = urlParams.get('token');
      const user = urlParams.get('user');
      localStorage.setItem('gptconsoletoken', token);
      localStorage.setItem('gptconsoleuser', user);

      console.log(`     
        ${consoleFormat(`You loggged in as ${user}`, 'green')}
     `);
        callback(null);
      // Use the parameter in the response
      res.end();
      server.close();
    });

    server.listen(port, () => {
      //console.log(`Server running at http://localhost:${port}/`);
    });
    a = "https://agent.gptconsole.ai/auth/login-page?logintype=gptconsole" //"http://localhost:3000/auth/login-page?logintype=gptconsole"  //
    console.log(`     
        ${consoleFormat('If login  not opened automatically:', 'green')}
        ${consoleFormat(`Copy pase this link the browser ${a}`, 'blue')} 
    `);    
    open(a)
    // console.log("Login successful");
}

function loginMessage(user) {
    console.log(`     
        ${consoleFormat(`Please login to your account`, 'green')}
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

function logoutMessage() {
    console.log(`     
        ${consoleFormat(`You have successfully logged out`, 'green')}
    `);
}
module.exports = {
    runSpinnerAndSaveResponse,
    runSpinnerAndReturnResponse,
    completerFunc,
    welcomeMessage,
    birdHelpMessage,
    pixieHelpMessage,
    chipHelpMessage,
    alreadyLoggedInMessage,
    loginMessage,
    messageAndOpenLogin,
    logoutMessage
}