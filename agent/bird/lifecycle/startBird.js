const { initBird } = require("../bird.js");
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');

async function startBird(userRequirement, callback) {
  try {
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
    
    const response = await fetch("https://us-central1-gptconsole.cloudfunctions.net/birdAvailableCredits", requestOptions)
    const isCreditAvailable = (await response.text()) === 'true';
    if(isCreditAvailable){
      const page = await initBird(userRequirement, callback)
      return page;
    }else{
      // process.stdout.write(`\x1b[32mNo credits, no tweets. Bootstrapped life! 😅 Refill? https://gptconsole.ai 🙏\x1b[0m\n`);

      process.stdout.write(`\x1b[32mCan't launch, I'm credit-starved. We're bootstrapped, Not VC-backed yet!😅 Fuel me up? https://gptconsole.ai 🙏\x1b[0m\n`);
    callback(null);
    return;
    }
    
  } catch (error) {
    return; 
   //console.log("=====errror===", error);
  }
}

module.exports = {
    startBird
}


