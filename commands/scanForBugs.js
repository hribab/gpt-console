const { SCAN_FOR_BUGS } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function scanForBugs(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${SCAN_FOR_BUGS(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to scan the code for bugs.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "bugs");  
    return callback(null, `Response saved to file bugs_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during scan the code for bugs.: ${err}`);
  }
}

module.exports = {
    scanForBugs
}
