#!/usr/bin/env node
const semver = require('semver'); // Use the 'semver' package to handle version comparison
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const repl = require("repl");
const {
  completerFunc,
  welcomeMessage,
  birdHelpMessage,
  chipHelpMessage,
  pixieHelpMessage,
  alreadyLoggedInMessage,
  loginMessage,
  messageAndOpenLogin,
  logoutMessage,
  nvmUpdateMessage
} = require("./utils/helper/cliHelpers");
const currentNodeVersion = process.versions.node;
if (!semver.eq(currentNodeVersion, '19.2.0')) {
    nvmUpdateMessage(currentNodeVersion)
    return;
}
const { exec } = require("child_process");
const { birdLLM } = require("./utils/api/apiCall");
const spinners = require("cli-spinners");
const { handleDefaultCase } = require("./commands/defaultCommand");
const { startPixie } = require("./agent/pixie/lifecycle/startPixie");
const { updatePixie } = require("./agent/pixie/lifecycle/updatePixie");
const { stopPixie } = require("./agent/pixie/lifecycle/stopPixie");
const { statusPixie } = require("./agent/pixie/lifecycle/statusPixie");
const { startBird } = require('./agent/bird/lifecycle/startBird')
const { stopBirdOperation } = require('./agent/bird/lifecycle/stopBird')
require('events').EventEmitter.defaultMaxListeners = 100;
const fetch = require("node-fetch");
const stream = require("stream");
const fs = require("fs");
const fse = require("fs-extra");

const unzipper = require("unzipper");
const { promisify } = require("util");
const util = require("util");
const { copySync, removeSync } = require("fs-extra");
const path = require("path");
const streamPipeline = util.promisify(require("stream").pipeline);
const pipeline = promisify(stream.pipeline);

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generator = require("@babel/generator").default;
// localStorage.removeItem('gptconsoletoken');
// localStorage.removeItem('gptconsoleuser');
const logginedUser = localStorage.getItem('gptconsoleuser');
// console.log("---gptconsoletoken-", localStorage.getItem('gptconsoletoken'))
welcomeMessage(logginedUser);
// Create REPL instance
const gptCli = repl.start({
  prompt: "gpt-console>",
  useColors: true,
  completer: completerFunc,
});
// Override default evaluator function

gptCli.eval = async (input, context, filename, callback) => {
  if (!input.trim()) {
    callback(null);
    return;
  }
  const tokens = input.trim().toLowerCase().split(" ");

  const command = tokens[0];

  switch (command.trim()) {
    case "login":
      if(!localStorage.getItem('gptconsoleuser')){
        messageAndOpenLogin(callback)
      }else{
        alreadyLoggedInMessage(localStorage.getItem('gptconsoleuser'))
        callback(null);
      }
      break;
    case "logout":
      localStorage.removeItem('gptconsoletoken');
      localStorage.removeItem('gptconsoleuser');
      logoutMessage();
      callback(null);
      break;
    case "bird":
      if(!localStorage.getItem('gptconsoleuser')){
        messageAndOpenLogin(callback)
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "start") {
        let matches = input.match(/bird start ['"]?(.*)['"]?/);
        let extractedText = matches && matches[1] ? matches[1] : null;
        extractedText = extractedText && extractedText.replace(/^['"]|['"]$/g, "");
        await startBird(extractedText, callback);
        process.stdout.write('\r');
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "stop") {
        await stopBirdOperation();
        callback(null);
        break;
      }
      birdHelpMessage();
      callback(null);
      break;
    case "chip":
      chipHelpMessage();
      callback(null);
      break;
    case "pixie":
      if(!localStorage.getItem('gptconsoleuser')){
        messageAndOpenLogin(callback)
        callback(null);
        break;
      }
 
      if (tokens[1] && tokens[1].trim() == "start") {
        let matches = input.match(/pixie start ['"]?(.*)['"]?/);
        let extractedText = matches && matches[1] ? matches[1] : null;
        if (extractedText) {
          extractedText = extractedText.replace(/^['"]|['"]$/g, "");
          await startPixie(extractedText, callback);
          process.stdout.write('\r');
        }
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "update") {
        let matches = input.match(/pixie update ['"]?(.*)['"]?/);
        let extractedText = matches && matches[1] ? matches[1] : null;

        if (extractedText) {
          extractedText = extractedText.replace(/^['"]|['"]$/g, "");
          await updatePixie(extractedText, callback);
        }
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "stop") {
        stopPixie();
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "status") {
        statusPixie();
        callback(null);
        break;
      }
      pixieHelpMessage();
      callback(null);
      break;
    case "help":
      welcomeMessage();
      callback(null);
      break;
    case "exit":
    case "quit":
    case "q":
    case "\u0003":
      process.exit();
      break;
    default:
      if(!logginedUser){
        loginMessage()
        callback(null);
        break;
      }
 
      (async () => {
        await handleDefaultCase(input, callback);
        callback(null);
      })();
      break;
  }
};
