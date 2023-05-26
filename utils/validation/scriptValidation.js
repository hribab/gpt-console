const fs = require('fs');

function validateCommandInputs(commands, callback) {
    if (commands.length < 2) {
        return callback(null, `Wrong Input. Usage: lint-code <filename.extension>`);
    }
    const fileName = commands[1]
    if (fileName.trim().length === 0) {
        return callback(null, `Wrong Input. Usage: lint-code <filename.extension>`);
    }
    if (!fs.existsSync(fileName.trim())) {
        return callback(null, `File does not exist.`);
    }
}

module.exports = {
    validateCommandInputs
}
