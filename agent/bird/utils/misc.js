const { 
    extractTextAndMetaFromURLForEachSection,
    extractURLs
  } = require("./scrapeURL");
  const { generateResponse } = require("../../../utils/api/apiCall");

  const moment = require('moment');

function getTwitterAction() {
    const options = ['tweet', 'tweetWithImage', 'reply', 'replyWithImage'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
}

async function extractContentFromFirstURL(userRequirement) {
    let listOfURLFromRequirement, contentFromFirstURL;
    if(userRequirement){
        listOfURLFromRequirement = extractURLs(userRequirement)
        // console.log("=================", listOfURLFromRequirement)
        if(listOfURLFromRequirement.length > 0){
            contentFromFirstURL = await extractTextAndMetaFromURLForEachSection(listOfURLFromRequirement[0])
        }     
    }
    return contentFromFirstURL;
}


function parseTime(timeText) {
    if (timeText === 'yesterday') return 0;// moment().subtract(1, 'days').valueOf();
    if (timeText.match(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/)) return 0;//moment().day(timeText).valueOf();
    return moment(timeText, 'hh:mm A').valueOf();
  }
async function whatsappAutoComplete(page){
    const divs = await page.$$('[role="listitem"]');
    // console.log("----divs", divs);
    let latestTime = 0;
    let latestDiv;
    for (const div of divs) {
      const timeElement = await div.$('.aprpv14t');
      if (timeElement) {
        const timeText = await page.evaluate(element => element.textContent.trim(), timeElement);
       // console.log(`Found time: ${timeText}`); // Debugging log
       const time = parseTime(timeText);
        if (time > latestTime) {
        latestTime = time;
        latestDiv = div;
        }
      }
    }
    
    // console.log("latestDiv", latestDiv);
    if (latestDiv) {
      await latestDiv.click();
      await page.waitForSelector('[role="application"]');
      const applicationDiv = await page.$('[role="application"]');


    // Extract both the copyable-text and the immediate plain text
    const combinedText = await page.evaluate(() => {
        let result = '';
        const copyableElements = document.querySelectorAll('div.copyable-text');
    
        copyableElements.forEach(element => {
        const copyableText = element.getAttribute('data-pre-plain-text') || '';
        const plainText = element.textContent.trim() || '';
        result += copyableText + plainText + '\n';
        });
    
        return result;
    }, applicationDiv);
    
    // console.log('Combined copyable-text and plain text:', combinedText);
    
    } else {
      // console.log('No matching div found.');
    }
}

async function getTheOperationFromPrompt(userRequirement, contentFromURLIfAny) {
    const prompt = `
    ${userRequirement ? "For givne user requirement: "+ userRequirement : ''}

    ${contentFromURLIfAny && contentFromURLIfAny.plainText ? "Text content from the URL "+ contentFromURLIfAny.plainText : ''}
   
    I want you to act as a prompt parser. Your job is to determine the action to be taken based on the user requirement.
    
    Available actions are tweet, reply. You need to return the action and the number of times the action to be performed.
    If the requirement is not one of the above actions, you need to return the action as "none" and the count as 0.

    example output: {"action": tweet or reply, "count": the number of times the action to be performed}
    
    Response Must be only JSON , no other text should be there. Explanation is NOT required.
    
    Request: Response should be able to parse by a below javascript function:
    function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
    `

    // console.log("----prompt : ", prompt);

    const chatgptresponse = await generateResponse(prompt, false);
    // console.log("----chatgptresponse : ", chatgptresponse);
    let operationObject;
    try {
        // Try to parse the input directly.
        operationObject = JSON.parse(chatgptresponse);
    } catch(e) {
        const chatgptresponse2 = await generateResponse(prompt, false);
        try {
            // Try to parse the input directly.
            operationObject = JSON.parse(chatgptresponse2);
        } catch(e) {
            operationObject = {"action": "none", "count": 0}
            
        }
    }
    if(!operationObject){
        operationObject = {"action": "none", "count": 0}
    }
    if(operationObject && !operationObject.action){
        operationObject = {"action": "none", "count": 0}
    }
    return operationObject;
}


module.exports = {
    getTwitterAction,
    extractContentFromFirstURL,
    getTheOperationFromPrompt
};


