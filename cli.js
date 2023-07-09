#!/usr/bin/env node

const repl = require("repl");

const { completerFunc, welcomeMessage, birdHelpMessage, chipHelpMessage, pixieHelpMessage } = require('./utils/helper/cliHelpers')
const { handleDefaultCase } = require('./commands/defaultCommand')
const { pauseBird } = require('./agent/bird/lifecycle/pauseBird')
const { startBird } = require('./agent/bird/lifecycle/startBird')
// const { stopBird } = require('./agent/bird/stopBird')
// const { statusBird } = require('./agent/bird/statusBird')

welcomeMessage();
// Create REPL instance
const gptCli = repl.start({
  prompt: "gpt-console>",
  useColors: true,
  completer: completerFunc
});  
// Override default evaluator function
gptCli.eval = async (input, context, filename, callback) => {
  if (!input.trim()) { 
    callback(null, );
  }
  const tokens = input.trim().toLowerCase().split(" ");
  const command = tokens[0];
  switch (command.trim()) {
    case "bird":
      if (tokens[1] && tokens[1].trim() == 'start') {
        startBird();
        callback(null, );
        break;
      }
      if (tokens[1] && tokens[1].trim() == 'pause') {
        pauseBird();
        callback(null, );
        break;
      }
      if (tokens[1] && tokens[1].trim() == 'stop') {
        stopBird();
        callback(null, );
        break;
      }
      if (tokens[1] && tokens[1].trim() == 'status') {
        statusBird()
        callback(null, );
        break;
      }
      birdHelpMessage();
      callback(null, );
      break;
    case "chip":
      chipHelpMessage();
      callback(null, );
      break;
    case "pixie":
      pixieHelpMessage();
      callback(null, );
      break;
    case "help":
      welcomeMessage();
      callback(null, );
      break;
    case "exit":
    case "quit":
    case "q":
    case "\u0003":
        process.exit();
        break;
    default:
      (async () => {
        await handleDefaultCase(input, callback);
        callback(null, );
      })();
      break;
  }
};
