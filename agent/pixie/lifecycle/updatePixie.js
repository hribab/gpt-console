const { 
    updatePixieOperation
 } = require("../pixie.js");
const spinners = require("cli-spinners");

async function updatePixie(input, callback) {
    try {
        const spinner = spinners.dots;    
        const interval = setInterval(() => {
            process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
            spinner.interval++;
        }, spinner.frameLength);
        
        await updatePixieOperation(input, callback)
        clearInterval(interval);
        return callback(null, "Completed");
      } catch (error) {
        //TODO: handle exception
        return callback(null, "Error Occured, Please try again");
      }    
}
  
module.exports = {   
    updatePixie
}