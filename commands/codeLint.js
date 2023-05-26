const { LINT } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function codeLint(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${LINT(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
    return callback(null, "File is too large to lint.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "lint")
    return callback(null, `Response saved to file lint_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during code linting: ${err}`);
  }
}

module.exports = {
    codeLint
}