const { REVIEW } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function codeReview(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${REVIEW(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to review.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "review");

    return callback(null, `Response saved to file review_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during code review: ${err}`);
  }
}

module.exports = {
    codeReview
}


