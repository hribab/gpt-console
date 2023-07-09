const fetch = require('node-fetch');
const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');

const pipeline = promisify(stream.pipeline);

async function tweet(page, waitTime) {
    await page.waitForTimeout(3000);
    await page.click('svg.r-1nao33i');
    await page.waitForTimeout(3000);
    console.log("Generating GPT response: ");
 
    let chatgptresponse0 = await generateResponse(`
    Please generate a single random tweet that make people LAUGH, then THINK
    Requirements are
    1. Maximum allowed characters are 280,
    3. the maximum character length of tweet is 250 characters including the text after #,
    no other text should there in response
    4. The text must contain #
    5. It should be ready to post tweet, text should not be enclosed in doubles quotes, no other text should be there in the response, only tweet should be there
    `, false);
    console.log("----chatgpt results: ", chatgptresponse0);
    if (chatgptresponse0.includes('#')) {
        console.log('');
    }else {
        console.log('error occured calling tweet function again');
       
    }
        
    const inputElement = await page.$('div.public-DraftStyleDefault-block span');
    const textToPaste = chatgptresponse0;
    // Simulate the paste operation by injecting JavaScript code
    await page.evaluate((element, text) => {
        // Create a new event for the paste operation
        const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
          // Set the clipboard data for the paste event
        const clipboardData = {
            getData: () => text,
        };
        Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
        // Dispatch the paste event on the input element
        element.dispatchEvent(pasteEvent);
    }, inputElement, textToPaste);
    console.log("it's pasted");
    await page.waitForTimeout(10000);
    await page.click('[data-testid="tweetButtonInline"]');
    await page.evaluate(() => {
        const button = document.querySelector('div[data-testid="tweetButtonInline"]');
        button.click();
     });
    console.log("the tweet button is clicked");
}

async function tweetWithImage(page, waitTime) {
    console.log("insdie tweet image ");
    await page.click('svg.r-1nao33i');
    await page.waitForTimeout(3000);
    console.log("Generating GPT response: ");


 
    let chatgptresponse0 = await generateResponse(`
    Please generate a single random tweet that make people LAUGH, then THINK
    Requirements are
    1. Maximum allowed characters are 280,
    3. the maximum character length of tweet is 250 characters including the text after #,
    no other text should there in response
    4. The text must contain #
    5. It should be ready to post tweet, text should not be enclosed in doubles quotes, no other text should be there in the response, only tweet should be there
    `, false);
    console.log("----chatgpt results: ", chatgptresponse0);
    if (chatgptresponse0.includes('#')) {
        console.log('');
    }else {
        console.log('error occured calling tweet function again');
       
    }
        
    const inputElement = await page.$('div.public-DraftStyleDefault-block span');
    const textToPaste = chatgptresponse0;

    const userRequirement = "I want to build landig page for my ecommerce site that sells spices from nepal mountains"

    const gptPrompt = `I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
    Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc

    Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
    example output: {"positive_prompt": "", "negative_prompt": ""}

    Here is your first prompt: "Most realistic image that convey the idea ${chatgptresponse0}
    "

    Main requirement is response must be in json
`
    const gptRawResponse = generateResponse(gptPrompt)
    
        const response = JSON.parse(gptRawResponse)
        console.log("===image prompt resones====", response)
    // Define headers and body for POST request
    const myHeaders = {
    "accept": "application/json",
    "authorization": "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
    "content-type": "application/json"
    };

    console.log("===image prompt resones====", response)
    const raw = JSON.stringify({
        "prompt": `${response.positive_prompt}. 8K, hyper realistic, Uplight f/1.8 --ar 16:9 --seed 3000 --q 2 --v 5`,
        "negative_prompt": response.negative_prompt,
        "width": 1024,
        "height": 1024,
        "modelId": "291be633-cb24-434f-898f-e662799936ad",
        "guidance_scale": 7,
        "presetStyle": "LEONARDO",
        "num_images": 1
    });

    const postOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    // Function to generate image
    async function generateImage() {
    try {
        const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", postOptions);
        const data = await response.json();
        return data.sdGenerationJob.generationId;
    } catch (error) {
        console.error('Error:', error);
    }
    }

    // Function to get image details
    async function getImageDetails(generationId) {
    const getOptions = {
        method: 'GET',
        headers: {
        "accept": "application/json",
        "authorization": "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
        },
        redirect: 'follow'
    };

    while (true) {
        try {
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, getOptions);
        const data = await response.json();
        if (data.generations_by_pk.status === "COMPLETE") {
            return data.generations_by_pk.generated_images[0].url;
        }
        } catch (error) {
        console.error('Error:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
    }
    }

    // Function to download image
    async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
        await pipeline(response.body, fs.createWriteStream(filename));
    } catch (error) {
        console.error('Error:', error);
    }
    }

   
    const generationId = await generateImage();
    console.log("===generationId====", generationId)

        const imageUrl = await getImageDetails(generationId);
        console.log("===imageUrl====", imageUrl)
    await downloadImage(imageUrl, 'output.jpg');
    
    
    // Simulate the paste operation by injecting JavaScript code
    await page.evaluate((element, text) => {
        // Create a new event for the paste operation
        const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
          // Set the clipboard data for the paste event
        const clipboardData = {
            getData: () => text,
        };
        Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
        // Dispatch the paste event on the input element
        element.dispatchEvent(pasteEvent);
    }, inputElement, textToPaste);


    const fileInput = await page.$('input[type="file"]');

    // Set the value of the file input to the file path
    const filePath = 'output.jpg';
    await fileInput.uploadFile(filePath);

    // Wait for the file upload to complete or for any other necessary actions
    // Example: Wait for a success message
    await page.waitForSelector('.upload-success');


    console.log("it's pasted");
    await page.waitForTimeout(10000);
    await page.click('[data-testid="tweetButtonInline"]');
    await page.evaluate(() => {
        const button = document.querySelector('div[data-testid="tweetButtonInline"]');
        button.click();
     });
    console.log("the tweet button is clicked");
}

async function follow(page) {
    //await page.waitForTimeout(2000);
    await page.click('svg.r-1nao33i');
    await page.reload();
    await page.waitForTimeout(2000);
    await page.click('div[data-testid="UserCell"]');
    await page.waitForTimeout(10000);
    await page.click('[data-testid="placementTracking"]');
    console.log("clicked");
    await page.waitForTimeout(10000);
}
async function setTwitterAction() {
    function getRandomString() {
        const options = ['tweet', 'reply', 'follow'];
        const randomIndex = Math.floor(Math.random() * options.length);
        return options[randomIndex];
    }
    function getRandomMilliseconds() {
        // Generate a random number of minutes less than 2
        const milliseconds = Math.floor(Math.random() * 120000);
        return milliseconds;
    }
    const randomString = getRandomString();
    console.log(randomString);
    twitterActions = randomString;
    getRandomString();
    waitTime = getRandomMilliseconds();
    waitTime = 10000;
    minutesTime = Math.ceil(waitTime/60000);
    console.log(`Wait time is less than ${minutesTime} Minutes`);
}


async function reply(page, count, waitTime) {
    console.log("=====repslyiung====")


    // const tweetsData = await page.evaluate(() => {
    //     // Get all root tweet elements
    //     const rootTweetElements = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
    
    //     // Extract tweet text, URLs, external links and tweet class
    //     return rootTweetElements.map(rootElement => {
    //       const tweetTextElement = rootElement.querySelector('div[data-testid="tweetText"]');
    //       const tweetText = tweetTextElement ? tweetTextElement.textContent : null;
    //       const tweetClass = tweetTextElement ? tweetTextElement.className : null;
    
    //       const urlElement = rootElement.querySelector('a[href]');
    //       const urlIfAny = urlElement ? urlElement.href : null;
    
    //       const externalLinkElement = rootElement.querySelector('a[href][rel="noopener noreferrer nofollow"]');
    //       const externalLink = externalLinkElement ? externalLinkElement.href : null;
    //       if(!tweetText) return null;
    //       return {
    //         tweetText,
    //         tweetClass,
    //         urlIfAny,
    //         externalLink
    //       };
    //     }).filter(item => item !== null);
    //   });
    
    
    //     console.log("tweetsData===>", tweetsData)
  
  
    //   const prompt = `
    //   Imagine you are a decision maker tasked with deciding whether to respond to a tweet or not.
    //   Given a list of tweets, select the top tweet that meets the following criteria: 
    //   - it is cool
    //   - easy-going
    //   - fun
    //   - impactful
    //   - it wouldn't cause any controversy if responded to with humor. 
  
    //   sample Input: [{
    //     tweetText: "test",
    //     tweetClass: "test",
    //     urlIfAny: "test",
    //     externalLink: "test"
    //   },{}]
  
    //   *actual Tweet is the value of key 'tweetText'.
      
    //   After you pick the top tweet, generate a reply that meets the following criteria:
    //   - the maximum character length of reply tweet is 250 characters including the text after #.
    //   - The tweet should have genuine humor
    //   - The reply tweet should be positive and thought provoking
    //   - The reply tweet should be relatable to people
  
  
    //   sample Output: {
    //     tweetText: "test",
    //     tweetClass: "test",
    //     urlIfAny: "test",
    //     externalLink: "test",
    //     reply: "test"
    //   }
      
    //   Tweets array:
    //   ${JSON.stringify(tweetsData)}
    // `
          
    // console.log("----prompt results: ", prompt);
  
    //   let chatgptresponse = await generateResponse(prompt, false);
  
  
    //   console.log("----chatgpt results: ", JSON.parse(chatgptresponse).reply);
  
  
  
  
  
  

    
    
    
    for (i = 0; i < count; i++) {
        try {
            // await page.waitForTimeout(2000);
            await page.click('svg.r-1nao33i');
            await page.reload();
            // await page.waitForTimeout(waitTime);
            console.log("Tweet ",i+1);
            await page.waitForTimeout(2000);
            await page.click('.css-1dbjc4n.r-1awozwy.r-onrtq4.r-18kxxzh.r-1b7u577');
            // Extract the text from the tweet
            await page.waitForTimeout(3000);
            let textContent = await page.evaluate(() => {
                const div = document.querySelector('div[data-testid="tweetText"]');
                return div.textContent;
            });
            let chatgptresponse;
            let callcount = 0;
            while(true){
                console.log(textContent);
                chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet.
                Conditions:
                    the maximum character length of tweet is 200 characters,
                    the text must contain #,
                    The text after # should not exceed 20 characters,
                    The tweet should be relatable to people, The tweet should have geniune humor,
                    The tweet is
                    : ${textContent}`, false);
                console.log("----chatgpt results: ", chatgptresponse);
                if (chatgptresponse.includes('#') && chatgptresponse.length < 280) {
                    console.log('');
                    break;
                }
                else {
                    console.log('error occured calling tweet function again');
                    callcount = callcount + 1;
                        if(callcount==5){
                            console.log("there is a problem with your api request please check");
                            break;
                        }//The tweet should have geniune humor,The tweet should be relatable to people,
                        chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet. Conditions:
                        the maximum character length of tweet is 200 characters,
                        the text must contain #,
                        The text after # should not exceed 20 characters,
                        The tweet is
                        : ${textContent}`, false);
                    console.log("----chatgpt results: ", chatgptresponse);
                }
            }
                const inputElement = await page.$('div.public-DraftStyleDefault-block span');
                const textToPaste = chatgptresponse;
                // Simulate the paste operation by injecting JavaScript code
            await page.evaluate((element, text) => {
                // Create a new event for the paste operation
                const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                // Set the clipboard data for the paste event
                const clipboardData = {
                    getData: () => text,
                };
                Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
            // Dispatch the paste event on the input element
                element.dispatchEvent(pasteEvent);
            }, inputElement, textToPaste);
            console.log("it's pasted");
            await page.waitForTimeout(30000);
            await page.click('[data-testid="tweetButtonInline"]');
            await page.evaluate(() => {
            const button = document.querySelector('div[data-testid="tweetButtonInline"]');
            button.click();
        });
        console.log("the tweet button is clicked");
        }
        catch (error) {
            if (error === "Failed to launch the browser process!") {
                console.log("it entered more");
                //await browser.close();
                main();
            }
            console.error('An error occurred: here', error);
            console.log("it entered");
            console.error('You have clicked while the bot is running. The bot will restart itself in 20 seconds');
            await page.waitForTimeout(20000);
        }
    }
}
async function replyWithImage(page, count, waitTime) {
    console.log("=====repslyiung====")
    for (i = 0; i < count; i++) {
        try {
            // await page.waitForTimeout(2000);
            await page.click('svg.r-1nao33i');
            await page.reload();
            // await page.waitForTimeout(waitTime);
            console.log("Tweet ",i+1);
            await page.waitForTimeout(2000);
            await page.click('.css-1dbjc4n.r-1awozwy.r-onrtq4.r-18kxxzh.r-1b7u577');
            // Extract the text from the tweet
            await page.waitForTimeout(3000);
            let textContent = await page.evaluate(() => {
                const div = document.querySelector('div[data-testid="tweetText"]');
                return div.textContent;
            });
            let chatgptresponse;
            let callcount = 0;
            while(true){
                console.log(textContent);
                chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet.
                Conditions:
                    the maximum character length of tweet is 200 characters,
                    the text must contain #,
                    The text after # should not exceed 20 characters,
                    The tweet should be relatable to people, The tweet should have geniune humor,
                    The tweet is
                    : ${textContent}`, false);
                console.log("----chatgpt results: ", chatgptresponse);
                if (chatgptresponse.includes('#') && chatgptresponse.length < 280) {
                    console.log('');
                    break;
                }
                else {
                    console.log('error occured calling tweet function again');
                    callcount = callcount + 1;
                        if(callcount==5){
                            console.log("there is a problem with your api request please check");
                            break;
                        }//The tweet should have geniune humor,The tweet should be relatable to people,
                        chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet. Conditions:
                        the maximum character length of tweet is 200 characters,
                        the text must contain #,
                        The text after # should not exceed 20 characters,
                        The tweet is
                        : ${textContent}`, false);
                    console.log("----chatgpt results: ", chatgptresponse);
                }
            }
                const inputElement = await page.$('div.public-DraftStyleDefault-block span');
                const textToPaste = chatgptresponse;
                // Simulate the paste operation by injecting JavaScript code
            await page.evaluate((element, text) => {
                // Create a new event for the paste operation
                const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
                // Set the clipboard data for the paste event
                const clipboardData = {
                    getData: () => text,
                };
                Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
            // Dispatch the paste event on the input element
                element.dispatchEvent(pasteEvent);
            }, inputElement, textToPaste);
            console.log("it's pasted");
            await page.waitForTimeout(30000);
            await page.click('[data-testid="tweetButtonInline"]');
            await page.evaluate(() => {
            const button = document.querySelector('div[data-testid="tweetButtonInline"]');
            button.click();
        });
        console.log("the tweet button is clicked");
        }
        catch (error) {
            if (error === "Failed to launch the browser process!") {
                console.log("it entered more");
                //await browser.close();
                main();
            }
            console.error('An error occurred: here', error);
            console.log("it entered");
            console.error('You have clicked while the bot is running. The bot will restart itself in 20 seconds');
            await page.waitForTimeout(20000);
        }
    }
}


module.exports = {
    tweet, 
    tweetWithImage,
    replyWithImage,
    follow,
    reply,
}