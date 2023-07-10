#!/usr/bin/env node

const repl = require("repl");
const { exec } = require("child_process");
const { generateResponse } = require("./utils/api/apiCall");

const {
  completerFunc,
  welcomeMessage,
  birdHelpMessage,
  chipHelpMessage,
  pixieHelpMessage,
} = require("./utils/helper/cliHelpers");
const { handleDefaultCase } = require("./commands/defaultCommand");
const { pauseBird } = require("./agent/bird/lifecycle/pauseBird");
// const { startBird } = require('./agent/bird/lifecycle/startBird')
const { startPixie } = require("./agent/pixie/lifecycle/startPixie");
const { updatePixie } = require("./agent/pixie/lifecycle/updatePixie");
const { stopPixie } = require("./agent/pixie/lifecycle/stopPixie");
const { statusPixie } = require("./agent/pixie/lifecycle/statusPixie");


// const { stopBird } = require('./agent/bird/stopBird')
// const { statusBird } = require('./agent/bird/statusBird')
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

welcomeMessage();
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
  }
  const tokens = input.trim().toLowerCase().split(" ");
  const command = tokens[0];
  switch (command.trim()) {
    case "bird":
      if (tokens[1] && tokens[1].trim() == "start") {
        startBird();
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "pause") {
        pauseBird();
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "stop") {
        stopBird();
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "status") {
        statusBird();
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
      if (tokens[1] && tokens[1].trim() == "start") {
        let matches = input.match(/pixie start ['"]?(.*)['"]?/);
        let extractedText = matches && matches[1] ? matches[1] : null;

        if (extractedText) {
          extractedText = extractedText.replace(/^['"]|['"]$/g, "");
          console.log("======User requirement=====", extractedText);
          startPixie(extractedText);
        }
        callback(null);
        break;
      }
      if (tokens[1] && tokens[1].trim() == "update") {
        let matches = input.match(/pixie update ['"]?(.*)['"]?/);
        let extractedText = matches && matches[1] ? matches[1] : null;

        if (extractedText) {
          extractedText = extractedText.replace(/^['"]|['"]$/g, "");
          console.log("======User Update requirement=====", extractedText);
          updatePixie();(extractedText);
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
      (async () => {
        await handleDefaultCase(input, callback);
        callback(null);
      })();
      break;
  }
};
