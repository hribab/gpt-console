const { initPixie } = require("../pixie.js");
const spinners = require("cli-spinners");
const semver = require('semver'); // Use the 'semver' package to handle version comparison

    
async function startPixie(req, callback) {
  const currentNodeVersion = process.versions.node;

  if (!semver.eq(currentNodeVersion, '19.2.0')) {
    process.stdout.write(`\x1b[32mError: The current Node.js version is not 19.2. Please update to a newer version.\x1b[0m \n`);
    return callback(null);
  }

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
    process.stdout.write('\r');
    return callback(null)//, `${result}`);
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
