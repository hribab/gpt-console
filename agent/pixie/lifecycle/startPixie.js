const { initPixie } = require("../pixie.js");
const spinners = require("cli-spinners");
const semver = require('semver'); // Use the 'semver' package to handle version comparison
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const { trackPixie } = require("../../../utils/api/apiCall");
 
async function startPixie(req, callback) {
  const currentNodeVersion = process.versions.node;

  if (!semver.eq(currentNodeVersion, '19.2.0')) {
    process.stdout.write(`\x1b[32mError: The current Node.js version is not 19.2. Please update to a newer version.\x1b[0m \n`);
    return callback(null);
  }

  const email = localStorage.getItem('gptconsoleuser');
  const apiKey = localStorage.getItem('gptconsoletoken')
  var myHeaders = new Headers();
  myHeaders.append("Authorization", apiKey);
  myHeaders.append("Content-Type", "application/json");
  
  var raw = JSON.stringify({
    "email": email,
  });
  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  const response = await fetch("https://us-central1-gptconsole.cloudfunctions.net/pixieAvailableCredits", requestOptions)
  const isCreditAvailable = (await response.text()) === 'true';

  // console.log("isCreditAvailable=====>", isCreditAvailable);
  if(!isCreditAvailable){
    process.stdout.write(`\x1b[32mCan't launch, I'm credit-starved. We're bootstrapped, Not VC-backed yet!😅 Fuel me up? https://agent.gptconsole.ai 🙏\x1b[0m\n`);
    callback(null);
    return;
  }

  let interval;
  
  try {
    // callback(null, "Bot started, Please wait...");
    process.stdout.write('\r');

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
    
    const result = await initPixie(req, callback);//sleep(10000)//
    await trackPixie("Create", req);
    // process.stdout.write(`\x1b[32m Its finished \x1b[0m`);

    clearInterval(interval);
    process.stdout.write("\x1B[?25h");

    process.stdout.write('\r');
    return callback(null)//, `${result}`);
  } catch (error) {
    //TODO: handle exception
    console.log("error", error);
    clearInterval(interval);
    return callback(null, "Error Occured, Please try again");
  }
}

module.exports = {
  startPixie,
};
