const fs = require('fs');
const path = require('path');

function renameProjectFolderIfExist() {
    const dir = './yourproject';
    const date = new Date();
    const currentDate = date.toISOString().split('T')[0]; // format as "yyyy-mm-dd"
    const currentTime = date.toISOString().split('T')[1].split('.')[0].replace(/:/g, ''); // format as "hhmmss"

    // Check if folder exists
    if (fs.existsSync(dir)) {
        process.stdout.write(`\x1b[32m Moving existing pixie projects from current directory, they will be renamed to yourproject-old-currentDate-currentTime  \x1b[0m \n`);
        // Rename the folder
        fs.renameSync(dir, path.join('./', `yourproject-old-${currentDate}-${currentTime}`), err => {
            if (err) {
                // console.error(`Error renaming directory: ${err}`);
                process.stdout.write(`\x1b[32m Error renaming directory: ${err}  \x1b[0m \n`);
            } else {
                // console.log('Directory renamed successfully');
            }
        });
    } else {
        // // console.log('Directory does not exist');
    }
}

const createPixieConfigFile = (data) => {
    fs.writeFileSync('yourproject/pixieconfig.json', JSON.stringify(data, null, 2), 'utf-8');
}

const updatePixieConfigStatus = (status) => {
    let data = fs.readFileSync('yourproject/pixieconfig.json', 'utf-8');
    let jsonData = JSON.parse(data);

    jsonData.status = status;

    fs.writeFileSync('yourproject/pixieconfig.json', JSON.stringify(jsonData, null, 2), 'utf-8');
}

module.exports = {
    createPixieConfigFile,
    updatePixieConfigStatus,
    renameProjectFolderIfExist
}