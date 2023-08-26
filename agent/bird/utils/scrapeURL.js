const puppeteer = require('puppeteer');
const { birdLLM } = require("../../../utils/api/apiCall");


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
  let textContent;
  try {
      // Go to the URL
      await page.goto(url, { timeout: 30000 });
      // Extract the text content of the body
      textContent = await page.evaluate(() => {
          let plainText = '';
          plainText = document.body.innerText;
          // console.log("====plainText=======", plainText)
          if (plainText.length > 30000) {
              plainText = plainText.substring(0, 30000);
          }

          return { plainText };
      });
  } catch (error) {
      // console.log("========errro===", error)
      if (error instanceof puppeteer.errors.TimeoutError) {
          // Close the browser
          await browser.close();
          return {}; // Return null if a timeout occurs
      }
      //throw error; // Re-throw any other errors
      return {};
  }
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

