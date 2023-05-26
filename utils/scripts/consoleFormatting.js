const chalk = require('chalk');

function consoleFormat(message, color) {
    return chalk[color].bold(message);
}

function getContentType(response) {
    if (response) {
      const dataString = response.toString().trim();
      if (dataString.startsWith('{') && dataString.endsWith('}')) {
        return 'json';
      }
      return 'text';
    }
    return null;
}

function containsCodeBlock(text) {
    return /```[\s\S]+```/.test(text);
}
  
function formatCodeBlock(text) {
    const codeBlockRegex = /```([\s\S]+)```/;
    const match = text.match(codeBlockRegex);
    if (match) {
        const codeBlock = match[1];

        if (codeBlock) {
        const language = codeBlock.trim().split(/\s+/)[0];

        let parser = 'babel';
        if (language && language.length > 1) {
            parser = language.toLowerCase().includes("javascript") ? 'babel' : `prettier/parser-${language}`;
        }
        //TODO: const formattedCodeBlock = prettier.format(codeBlock, { parser: parser });
        return text.replace(codeBlockRegex, chalk.green(codeBlock));
        } else {
        return text;
        }
    }
    return text;
}

function formatResponseForConsole(response) {
    if (!response) {
        return "Sorry Try Again";
    }
    const contentType = getContentType(response);
      
    switch (contentType) {
      case 'json':
        return prettier.format(response, { parser: 'json' });
      case 'text':
        return containsCodeBlock(response) ? formatCodeBlock(response) : response;
      default:
        return response;
    }
}

module.exports = {
    consoleFormat,
    formatResponseForConsole
}
