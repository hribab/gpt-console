const { OPTIMIZE } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function codeOptimize(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${OPTIMIZE(language)} ${fileContent}`;
   
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to optimize.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "optimize")
    return callback(null, `Response saved to file optimize_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during code optimize: ${err}`);
  }
}

module.exports = {
    codeOptimize
}
