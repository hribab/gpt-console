const { GENERATE_DOC } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function generateDocumentation(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${GENERATE_DOC(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to write documentation.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "documentation");
      
    return callback(null, `Response saved to file documentation_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during code documentation: ${err}`);
  }
}

module.exports = {
    generateDocumentation
}


