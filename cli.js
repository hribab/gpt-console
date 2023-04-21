#!/usr/bin/env node

const repl = require("repl");
const { exec } = require("child_process");
const spinners = require("cli-spinners"); // TODO: use this to show spinner while waiting for response

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "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",
});
const openai = new OpenAIApi(configuration);

async function generateResponse(prompt) {
  if (!prompt) {
    return;
  }
  let model = "gpt-4"
  //TODO( if input is code related, use davinci model)
  if (false) {
    model = "text-davinci-002"
  }
  const completion = await openai.createChatCompletion({
    model: model,
    messages: [{role: "user", content: prompt}],
  });

  const response = completion.data.choices[0].message.content.trim();
  return `${response}`
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
          callback(null, `Done`);
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
