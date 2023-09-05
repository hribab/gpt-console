const { formatResponseForConsole } = require("../utils/scripts/consoleFormatting");
const { runSpinnerAndReturnResponse } = require("../utils/helper/cliHelpers");
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');

async function handleDefaultCase(input, callback) {
try {      
    if (!input.trim()) {
        return;
    }
    if (input.trim() && input.trim().length < 3) {
      return;
   }
    if (input.length > 30000) {
        return callback(null, "Text is too large to process.");
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
    
    const response = await fetch("https://us-central1-gptconsole.cloudfunctions.net/consoleAvailableCredits", requestOptions)
    const isCreditAvailable = (await response.text()) === 'true';
    // console.log("isCreditAvailable=====>", response, isCreditAvailable);
    if(isCreditAvailable){
      const resp = await runSpinnerAndReturnResponse(input);
      console.log(`\n\n\n ${formatResponseForConsole(resp)} \n\n`);
      callback(null);
      return;
    }else{
      // process.stdout.write(`\x1b[32mNo credits, no tweets. Bootstrapped life! 😅 Refill? https://gptconsole.ai 🙏\x1b[0m\n`);

      process.stdout.write(`\x1b[32mResource crunch: Low on credits. We're bootstrapped, not VC-backed. Refuel at https://agent.gptconsole.ai? 🚀💎\x1b[0m\n`);
      callback(null);
      return;
    }


  } catch (err) {
    console.log(err);
    return `An error occurred during API call: ${err}`;
  }
}

module.exports = {
    handleDefaultCase
}