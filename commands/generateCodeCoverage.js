// const { CODE_COVERAGE } = require("../prompts/command/cliCommands");
// const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
// const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

// async function generateCodeCoverage(codeFile, testFile, callback) {
//   try {
//     const { fileContent, language } = cleanFileForPrompt(fileName);
//     const finalPrompt = `${CODE_COVERAGE(language)} ${fileContent}`;
//     if (finalPrompt.length > 8000) {
//       return callback(null, "File is too large to generate unit test cases.");
//     }
//     await runSpinnerAndSaveResponse(finalPrompt, fileName, "unittests");
      
//     return callback(null, `Response saved to file unittests_${fileName}`);
//   } catch (err) {
//     return callback(null, `An error occurred during unit test: ${err}`);
//   }
// }

// module.exports = {
//   generateCodeCoverage
// }
