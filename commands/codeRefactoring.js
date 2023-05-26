const { REFACTOR } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function codeRefactor(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${REFACTOR(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to refactor.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "refactor");
    return callback(null, `Response saved to file refactor_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during code refactor: ${err}`);
  }
}

module.exports = {
    codeRefactor
}
