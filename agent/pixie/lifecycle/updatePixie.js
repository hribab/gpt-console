const { 
    updatePixieOperation
 } = require("../pixie.js");
const spinners = require("cli-spinners");
const semver = require('semver'); // Use the 'semver' package to handle version comparison

async function updatePixie(input, callback) {
    const currentNodeVersion = process.versions.node;
        if (!semver.eq(currentNodeVersion, '19.2.0')) {
            process.stdout.write('Error: The current Node.js version is less than 19.2. Please update to a newer version.\n' +
            'Instructions:\n' +
            '1. Install NVM:\n' +
            '   - Using Brew: brew install nvm\n' +
            '   - Or using Curl: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash\n' +
            '2. Add NVM to bash profile: echo "export NVM_DIR=~/.nvm" >> ~/.bash_profile && echo "[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm" >> ~/.bash_profile\n' +
            '3. Run: nvm install 19.2\n' +
            '4. Run: nvm use 19.2');

            return callback(null);
        }
    try {
        const spinner = spinners.dots;    
        const interval = setInterval(() => {
            process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
            spinner.interval++;
        }, spinner.frameLength);
        await updatePixieOperation(input, callback)
        clearInterval(interval);
        process.stdout.write('\r');

        return callback(null, "Completed");
      } catch (error) {
        //TODO: handle exception
        return callback(null, `Error Occured, Please try again ${error}`);
      }    
}
  
module.exports = {   
    updatePixie
}