const { 
    updatePixieOperation
 } = require("../pixie.js");
const spinners = require("cli-spinners");
const semver = require('semver'); // Use the 'semver' package to handle version comparison
const { trackPixie } = require("../../../utils/api/apiCall");

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
    let interval;

    try {
        

         // Initialize
        let timeCount = 0;
        let frame = 0;
        let spinnerIndex = 0;
        const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        const frames = ['◐', '◓', '◑', '◒'];

        // Hide cursor
        // process.stdout.write("\x1B[?25l");

        const interval = setInterval(() => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        
        process.stdout.write("\x1B[?25l");

        const mins = Math.floor(timeCount / 60);

        // Spinner
        const spinnerSymbol = spinnerFrames[spinnerIndex];

        // Rotating circle
        const rotationSymbol = frames[frame];

        process.stdout.write(`\x1b[32m [${mins}m] ${spinnerSymbol} ${rotationSymbol} \x1b[0m`);


        spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
        frame = (frame + 1) % frames.length;
        
        timeCount++;
        }, 1000);

        // Show cursor when process exits
        process.on('exit', () => {
        process.stdout.write("\x1B[?25h");
        });

        const result = await updatePixieOperation(input, callback)
        await trackPixie("Create", input);
        clearInterval(interval);
        process.stdout.write('\r');
        process.stdout.write("\x1B[?25h");

        return callback(null, "Completed");
      } catch (error) {
        //TODO: handle exception
        clearInterval(interval);
        process.stdout.write("\x1B[?25h");
        return callback(null, `Error Occured, Please try again ${error}`);
      }    
}
  
module.exports = {   
    updatePixie
}