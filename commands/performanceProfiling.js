const { GENERATE_PERFORMANCE_PROFILING } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function performanceProfiling(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${GENERATE_PERFORMANCE_PROFILING(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to generate performance profiling code.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "performanceprofile");      
    return callback(null, `Response saved to file performanceprofile_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during generate performance profiling code: ${err}`);
  }
}

module.exports = {
    performanceProfiling
}
