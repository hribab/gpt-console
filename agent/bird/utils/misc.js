const { 
    extractTextAndMetaFromURLForEachSection,
    extractURLs
  } = require("./scrapeURL");

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
module.exports = {
    getTwitterAction,
    extractContentFromFirstURL
};


