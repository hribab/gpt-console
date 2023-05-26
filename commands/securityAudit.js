const { SECURITY_AUDIT } = require("../prompts/command/cliCommands");
const { cleanFileForPrompt } = require("../utils/scripts/fileOperations");
const { runSpinnerAndSaveResponse } = require("../utils/helper/cliHelpers");

async function scanForSecurity(fileName, callback) {
  try {
    const { fileContent, language } = cleanFileForPrompt(fileName);
    const finalPrompt = `${SECURITY_AUDIT(language)} ${fileContent}`;
    if (finalPrompt.length > 8000) {
      return callback(null, "File is too large to scan the code for security issues.");
    }
    await runSpinnerAndSaveResponse(finalPrompt, fileName, "security_audit");
    return callback(null, `Response saved to file security_audit_${fileName}`);
  } catch (err) {
    return callback(null, `An error occurred during scan the code for security issues: ${err}`);
  }
}

module.exports = {
    scanForSecurity
}
