#!/usr/bin/env node

const repl = require("repl");
const { exec } = require("child_process");
const spinners = require("cli-spinners");

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "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",
});
const openai = new OpenAIApi(configuration);

async function generateResponse(prompt) {
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
  let loader = setInterval(() => {
    process.stdout.write(".");
  }, 100);

  const response = await generateResponse(input);
  
  clearInterval(loader); // clear loader

  process.stdout.write('\033[0G'); // move cursor to beginning of line

  callback(null, response); 
};
