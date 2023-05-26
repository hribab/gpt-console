const fs = require('fs/promises');
const linguistLanguages = require('linguist-languages');

async function saveResponseToNewFile(data, fileName) {
  try {
    await fs.writeFile(fileName, data);
    return true;
  } catch (err) {
    // console.error(`Error saving file: ${err}`);
    return false;
  }
}

// Get the programming language from the file extension
function getLanguageFromExtension(extension) {
    const languages = Object.values(linguistLanguages);
    const language = languages.find(lang => lang?.extensions?.includes(extension));
    return language ? language.name : 'Unknown';
    
}

function getFileExtension(filename) {
    if (filename.startsWith('.')) {
        return filename;
    }
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === filename.length - 1) {
      return ''; // No extension found or the filename starts or ends with a dot
    }
    return filename.substring(lastDotIndex);
}

module.exports = {
    saveResponseToNewFile,
    getLanguageFromExtension,
    getFileExtension
}
