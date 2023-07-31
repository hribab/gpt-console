const { initPixie } = require("../pixie.js");
const spinners = require("cli-spinners");

    
async function startPixie(req, callback) {
  const spinner = spinners.dots;
  let interval;
  try {
    // callback(null, "Bot started, Please wait...");
    process.stdout.write('\r');
    interval = setInterval(() => {
      process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
      spinner.interval++;
    }, spinner.frameLength);
    const result = await initPixie(req, callback);
    clearInterval(interval);
    return callback(null, `${result}`);
  } catch (error) {
    //TODO: handle exception
    // console.log("error", error);
    clearInterval(interval);
    return callback(null, "Error Occured, Please try again");
  }
}

module.exports = {
  startPixie,
};
