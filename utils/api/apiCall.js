const { Configuration, OpenAIApi } = require("openai");
const { re } = require("semver");
const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');
const moment = require('moment');

async function trackBird(operation, operationdescription, imageURL = null) {
  const email = localStorage.getItem('gptconsoleuser');
  const apiKey = localStorage.getItem('gptconsoletoken')
  var myHeaders = new Headers();
  myHeaders.append("Authorization", apiKey);
  myHeaders.append("Content-Type", "application/json");
  const localtime = moment().format('HH:mm:ss');
  const localdate = moment().format('YYYY-MM-DD');
  
  var raw = JSON.stringify({
    "email": email,
    "log": {
      "localtime": localtime,
      "localdate": localdate,
      "operation": operation,
      "operationdescription": operationdescription,
      "imageURL": imageURL
    }
  });
  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  const response = await fetch("https://us-central1-gptconsole.cloudfunctions.net/trackBird", requestOptions)
  const texteRsponse =  await response.text();
  return texteRsponse;
}

async function birdLLM(prompt) {
  const email = localStorage.getItem('gptconsoleuser');
  const apiKey = localStorage.getItem('gptconsoletoken')
  var myHeaders = new Headers();
  myHeaders.append("Authorization", apiKey);
  myHeaders.append("Content-Type", "application/json");
  
  var raw = JSON.stringify({
    "email": email,
    "prompt": prompt
  });
  
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  const response = await fetch("https://us-central1-gptconsole.cloudfunctions.net/birdCall", requestOptions)
  const texteRsponse =  await response.text();
  return texteRsponse;
}
async function generateResponse(prompt, codeRelated = false) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY 
      });
    const openai = new OpenAIApi(configuration);
    if (!prompt) {
      return;
    }
    let model = "gpt-4"

    if (codeRelated) {
      model = "text-davinci-002"
    }
  try {
      const completion = await openai.createChatCompletion({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });
  
      const response = completion.data.choices[0].message.content.trim();
      return response;
  } catch (error) {
      console.log("=========", error)
      return `error`;
    }
}


async function generateResponseWithFunctions(prompt, codeRelated = false) {
  const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY 
    });
  const openai = new OpenAIApi(configuration);
  if (!prompt) {
    return;
  }
  let model = "gpt-4"

  if (codeRelated) {
    model = "text-davinci-002"
  }
try {
    const completion = await openai.createChatCompletion({
      model: model,
      messages: [{ role: "user", content: prompt }],
      messages: [{ role: "functions", 

      functions: [
        {
            "name": "extract_reply_tweetClass",
            "description": "Extract the reply tweet class",
            "parameters": {
                "type": "object",
                "properties": {
                    "response": {
                        "type": "object",
                        "description": "The city, place or any location" //, e.g. San Francisco, CA"
                    },
                   
                },
                "required": ["response"]
            }
        }
      ]
    }],
    });

    // console.log("=====frst====", completion.data.choices[0])
    const response = completion.data.choices[0].message.content.trim();
    return response;
} catch (error) {
    // console.log("===err======", error)
    return `error`;
  }
}
module.exports = {
  generateResponse,
  generateResponseWithFunctions,
  birdLLM,
  trackBird
}