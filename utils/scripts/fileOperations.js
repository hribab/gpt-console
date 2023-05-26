const fs = require('fs');
const { getLanguageFromExtension, getFileExtension } = require("./helperScripts");
const { removeComments } = require("./codeModificationScripts");

function cleanFileForPrompt(fileName) {
    let fileContent = fs.readFileSync(fileName, 'utf8');
    const fileExtension = getFileExtension(fileName);
    const language = getLanguageFromExtension(fileExtension);
    if (language === "JavaScript") {
        fileContent = removeComments(fileContent);
    }
    
    return { fileContent, language };
}

module.exports = {
    cleanFileForPrompt
}
