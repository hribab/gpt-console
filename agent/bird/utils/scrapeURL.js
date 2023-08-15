const puppeteer = require('puppeteer');
const { generateResponse } = require("../../../utils/api/apiCall");


function extractURLs(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-zA-Z]{2,})/g;
  let urls = text.match(urlRegex);
  if(urls && urls.length>0){
      // Add https:// before URLs that don't have http:// or https://
  urls = urls.map(url => url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url);

  // Remove duplicates
  urls = [...new Set(urls)];

  return urls;
  }else{
    return []
  }

}

async function extractTextAndMetaFromURLForEachSection(url) {
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: "new" });
    // Create a new page
    const page = await browser.newPage();
    // Go to the URL
    await page.goto(url);
    // Extract the text content of the body
    const textContent = await page.evaluate(() => {
        let plainText = '';
        plainText = document.body.innerText
        
        if (plainText.length > 30000) {
          plainText = plainText.substring(0, 30000);
        }
  
        return { plainText };
    });
    // Close the browser
    await browser.close();
    return textContent;
}

module.exports = {
    extractTextAndMetaFromURLForEachSection,
    extractURLs
};



//messaging from site 
//documentation form site
//messagin from readme

