const { ERROR_HANDLING } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function errorHandling(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${ERROR_HANDLING(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to write error handling.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "errorhandling");
    return callback(null, `Response saved to file errohandling_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during code error handling: ${err}`);
  }
}

module.exports = {
    errorHandling
}
