const { formatResponseForConsole } = require("../utils/scripts/consoleFormatting");
const { runSpinnerAndReturnResponse } = require("../utils/helper/cliHelpers");

async function handleDefaultCase(input, callback) {
try {      
    if (!input.trim()) {
        return;
    }
    if (input.length > 8000) {
        return callback(null, "Text is too large to process.");
    }
    const resp = await runSpinnerAndReturnResponse(input);
    console.log(`\n\n\n ${formatResponseForConsole(resp)} \n\n`);
    return;

  } catch (err) {
    return `An error occurred during API call: ${err}`;
  }
}

module.exports = {
    handleDefaultCase
}