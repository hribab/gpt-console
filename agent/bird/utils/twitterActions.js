const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');
const { generateResponse } = require("../../../utils/api/apiCall");
const {
    getImageDetails,
    downloadImage,
    generateImage
} = require("./imageGenerations")

const disclaimers = ["As an AI language model"]//, "Other disclaimer phrases"]; // Add other phrases as needed

async function getValidResponse(prompt, retryCount = 0) {
    let chatgptresponse = await generateResponse(prompt, false);
    // console.log("----chatgpt results: ", chatgptresponse);

    for (let disclaimer of disclaimers) {
        if (chatgptresponse.indexOf(disclaimer) !== -1) {
            if (retryCount < 1) {
                // console.log("Detected disclaimer, retrying...");
                return await getValidResponse(prompt, retryCount + 1); // Retry once
            } else {
                throw new Error("Response contains a disclaimer after retrying");
            }
        }
    }

    if (chatgptresponse.includes('#')) {
        return chatgptresponse;
    } else {
        // console.log('error occurred calling tweet function again');
        return null;
    }
}

async function tweet(page, userRequirement, contentFromURLIfAny) {
    // console.log("inside tweet ----", contentFromURLIfAny);
    await page.waitForTimeout(3000);
    await page.click('svg.r-1nao33i');
    await page.waitForTimeout(3000);
    // console.log("Generating GPT response: ");
    const prompt = `
    ${userRequirement ? "For givne user requirement: "+ userRequirement : ''}

    ${contentFromURLIfAny && contentFromURLIfAny.plainText ? "And Text content from the URL: "+ contentFromURLIfAny.plainText : ''}
    
    ${userRequirement ? "Compose a tweet that shares insights, tips, or information for the audience's benefit, engages the audience by asking questions or seeking opinions, utilizes a conversational tone, and articulates the product's offerings clearly. Please avoid mentioning the website name, using marketing tone. Should be short and crisp" : "Please generate a tweet that provides deeper insight and make people LAUGH, then THINK"}
    
    Requirements are
    1. Maximum allowed characters are 280,
    2. The text must contain #
    3. It should be ready to post tweet, no explanation is required, no other text should be there in the response, only tweet should be there

    Its important you get above requirements right
    `

    // console.log("----prompt : ", prompt);

    try {
        let chatgptresponse;
        let attempts = 0;
      
        while (attempts < 3) {
          chatgptresponse = await getValidResponse(prompt);
      
          if (chatgptresponse && chatgptresponse.length <= 280) {
            break;
          }
      
          attempts++;
        }
      
        if (attempts >= 3 || !chatgptresponse || chatgptresponse.length > 280) {
          return;
        }

        // console.log("----prompt results: ", chatgptresponse);
            
        const firstTwoCharacters = chatgptresponse.substring(0, 2);

        // Extract the last two characters
        const lastTwoCharacters = chatgptresponse.substring(chatgptresponse.length - 2);
        
        // Remove the first two characters and last two characters from chatgptresponse
        const modifiedResponse = chatgptresponse.substring(2, chatgptresponse.length - 2);
        
        await page.waitForTimeout(3000);
        await page.click('.css-1dbjc4n.r-16y2uox.r-bnwqim.r-13qz1uu.r-1g40b8q');
        // Type text into the element
        // console.log("div clicked");
        
        await page.waitForTimeout(3000);
        await page.keyboard.type(firstTwoCharacters);
        // console.log("keyboard typed");
        await page.waitForTimeout(3000);
        const inputElement = await page.$('div.public-DraftStyleDefault-block span');
        const textToPaste = modifiedResponse;
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
        // console.log("it's pasted");
        await page.keyboard.type(lastTwoCharacters);
        await page.waitForTimeout(100000);
        await page.click('[data-testid="tweetButtonInline"]');
        await page.evaluate(() => {
            const button = document.querySelector('div[data-testid="tweetButtonInline"]');
            button.click();
        });
        return;
        // // console.log("the tweet button is clicked");


    }
    catch(err) {
        return;
       // // console.log("===error===", err.message);
    }
}

async function reply(page, userRequirement, contentFromURLIfAny) {
    // console.log("=====reply====")

            const randomScrolls = Math.floor(Math.random() * 10) + 1;
            // console.log("randomScrolls===>", randomScrolls)
            // Scroll down three times
            for (let i = 0; i < randomScrolls; i++) {
              await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
              });
              await page.waitForTimeout(1000); // Wait a bit for new tweets to load
            }
        
        
            const tweetsData = await page.evaluate(() => {
              // Get all root tweet elements
              const rootTweetElements = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
          
              // Extract tweet text, URLs, external links and tweet class
            // return rootTweetElements.map(rootElement => {
            //     const tweetTextElement = rootElement.querySelector('div[data-testid="tweetText"]');
            //     const tweetText = tweetTextElement ? tweetTextElement.textContent : null;
            //     const tweetClass = tweetTextElement ? tweetTextElement.className : null;
          
            //     const urlElement = rootElement.querySelector('a[href]');
            //     const urlIfAny = urlElement ? urlElement.href : null;
          
            //     const externalLinkElement = rootElement.querySelector('a[href][rel="noopener noreferrer nofollow"]');
            //     const externalLink = externalLinkElement ? externalLinkElement.href : null;
            //     if(!tweetText) return null;
            //     return {
            //       tweetText,
            //       tweetClass,
            //       urlIfAny,
            //       externalLink
            //     };
            //   }).filter(item => item !== null);   
            return rootTweetElements.map(rootElement => {
                const tweetTextElement = rootElement.querySelector('div[data-testid="tweetText"]');
                const parentDivElement = tweetTextElement ? tweetTextElement.parentElement : null;
              
                // Check if immediate next sibling of parentDivElement has aria-labelledby attribute
                if (parentDivElement && parentDivElement.nextElementSibling && parentDivElement.nextElementSibling.hasAttribute('aria-labelledby')) {
                  return null;
                }
              
                const tweetText = tweetTextElement ? tweetTextElement.textContent : null;
                const tweetBoxID = tweetTextElement ? tweetTextElement.id : null; // Grabbing the id attribute
              
                const urlElement = rootElement.querySelector('a[href]');
                const urlIfAny = urlElement ? urlElement.href : null;
              
                const externalLinkElement = rootElement.querySelector('a[href][rel="noopener noreferrer nofollow"]');
                const externalLink = externalLinkElement ? externalLinkElement.href : null;
                
                if (!tweetText) return null;
              
                return {
                  tweetText,
                  tweetBoxID, // Including the id in the return object
                  urlIfAny,
                  externalLink
                };
              }).filter(item => item !== null);
              
                         
            });
          
            if (tweetsData.length === 0) {
                return;
            }
            // console.log("tweetsData===>", tweetsData)
        
        
            const prompt = `
            ${userRequirement ? "For givne user requirement: "+ userRequirement : ''}
            Imagine you are a decision maker tasked with deciding whether to respond to a tweet or not.
            Given a list of tweets, select the top tweet that meets the following criteria: 
            - it is cool, easy-going, fun
            - impactful
            - it wouldn't cause any controversy if responded to with humor.
        
            sample Input: [{
              tweetText: "test",
              tweetBoxID: "test",
              urlIfAny: "test",
              externalLink: "test"
            },{}]
        
            *actual Tweet is the value of key 'tweetText'.
            
            After you pick the top tweet, generate a reply that meets the following criteria:
            - the maximum character length of reply tweet is 230 characters including the text after #.
            - The tweet should have genuine humor
            - The reply tweet should be positive and thought provoking
            - The reply tweet should be relatable to people

            Its important that tweetText should have full context, dont pick the tweet that you dont have full context.
        
        
            Example Output: {
              tweetText: "test",
              tweetBoxID: "test",
              urlIfAny: "test",
              externalLink: "test",
              reply: "test"
            }
            
                
            Response Must be only JSON. No other text should be there in response. No explanation is required.
        
            Request: Response should be able to parse by a below javascript function:
            function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
            Tweets array:
            ${JSON.stringify(tweetsData)}
            `
                
            // console.log("----prompt: ", prompt)
        
            let chatgptresponse1 = await generateResponse(prompt, false);
        
            // console.log("chatgptresponse1------- ", chatgptresponse1);
            let replyTweet;
            try{
                replyTweet = JSON.parse(chatgptresponse1);
                // console.log("replyTweet------- ", replyTweet);

            }catch(err){
                let chatgptresponse1 = await generateResponse(prompt, false);
        
                // console.log("chatgptresponse2------- ", chatgptresponse1);
                try{
                    replyTweet = JSON.parse(chatgptresponse1);
                    // console.log("replyTweet------- ", replyTweet);

                }catch(err){
                    return;
                    // console.log("error occured calling tweet function again", err);
                }


                
                // console.log("error occured calling tweet function again", err);
            }
            if(!replyTweet){
                return;
            }
            if(replyTweet && replyTweet.tweetBoxID === 'N/A'){
                return;
            }
            if(replyTweet && !replyTweet.tweetBoxID){
                return;
            }

            if(replyTweet && !replyTweet.reply){
                return;
            }

            if(replyTweet && replyTweet.reply && replyTweet.reply.length > 250){
                return;
            }

            if(replyTweet && replyTweet.reply && replyTweet.reply.indexOf(disclaimer[0]) !== -1){
                return;
            }

            await page.waitForTimeout(2000);
            // await page.click('.css-1dbjc4n.r-1awozwy.r-onrtq4.r-18kxxzh.r-1b7u577');
            await page.click(`#${replyTweet.tweetBoxID}`);
            // Extract the text from the tweet
            await page.waitForTimeout(3000);
            let textContent = await page.evaluate(() => {
                const div = document.querySelector('div[data-testid="tweetText"]');
                return div.textContent;
            });
            
            let chatgptresponse = replyTweet.reply;
            // let callcount = 0;
            // while(true){
            //     // console.log(textContent);
            //     chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet.
            //     Conditions:
            //         the maximum character length of tweet is 200 characters,
            //         the text must contain #,
            //         The text after # should not exceed 20 characters,
            //         The tweet should be relatable to people, The tweet should have geniune humor,
                    
            //         The tweet is
            //         : ${textContent}`, false);
            //     // console.log("----chatgpt results: ", chatgptresponse);
            //     if (chatgptresponse.includes('#') && chatgptresponse.length < 280) {
            //         // console.log('');
            //         break;
            //     }
            //     else {
            //         // console.log('error occured calling tweet function again');
            //         callcount = callcount + 1;
            //             if(callcount==5){
            //                 // console.log("there is a problem with your api request please check");
            //                 break;
            //             }//The tweet should have geniune humor,The tweet should be relatable to people,
            //             chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet. Conditions:
            //             the maximum character length of tweet is 200 characters,
            //             the text must contain #,
            //             The text after # should not exceed 20 characters,
            //             The tweet is
            //             : ${textContent}`, false);
            //         // console.log("----chatgpt results: ", chatgptresponse);
            //     }
            // }
            const firstTwoCharacters = chatgptresponse.substring(0, 2);

            // Extract the last two characters
            const lastTwoCharacters = chatgptresponse.substring(chatgptresponse.length - 2);
            
            // Remove the first two characters and last two characters from chatgptresponse
            const modifiedResponse = chatgptresponse.substring(2, chatgptresponse.length - 2);
            
            await page.waitForTimeout(3000);
            await page.click('.css-1dbjc4n.r-16y2uox.r-bnwqim.r-13qz1uu.r-1g40b8q');
            // Type text into the element
            // console.log("div clicked");
            
            await page.waitForTimeout(3000);
            await page.keyboard.type(firstTwoCharacters);
            // console.log("keyboard typed");
            await page.waitForTimeout(3000);
            const inputElement = await page.$('div.public-DraftStyleDefault-block span');
            const textToPaste = modifiedResponse;
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
            // console.log("it's pasted");
            await page.keyboard.type(lastTwoCharacters);
            await page.waitForTimeout(1000);
            await page.click('[data-testid="tweetButtonInline"]');
            await page.evaluate(() => {
                const button = document.querySelector('div[data-testid="tweetButtonInline"]');
                button.click();
            });
            return;
        // console.log("the tweet button is clicked");
}

async function tweetWithImage(page, userRequirement, contentFromURLIfAny) {
    // console.log("inside tweet image ");
    await page.waitForTimeout(5000);
    await page.click('svg.r-1nao33i');
    await page.waitForTimeout(3000);
    // console.log("Generating GPT response: ");

    const prompt = `
    ${userRequirement ? "For givne user requirement: "+ userRequirement : ''}

    ${contentFromURLIfAny && contentFromURLIfAny.plainText ? "And Text content from the URL: "+ contentFromURLIfAny.plainText : ''}
    
    ${userRequirement ? "Compose a tweet that shares insights, tips, or information for the audience's benefit, engages the audience by asking questions or seeking opinions, utilizes a conversational tone, and articulates the product's offerings clearly. Please avoid mentioning the website name, using marketing tone. Should be short and crisp" : "Please generate a tweet that provides deeper insight and make people LAUGH, then THINK"}
    
    Requirements are
    1. Maximum allowed characters are 280,
    2. The text must contain #
    3. It should be ready to post tweet, no explanation is required, no other text should be there in the response, only tweet should be there

    Its important you get above requirements right
    `
    try{
        let chatgptresponse;
        let attempts = 0;
      
        while (attempts < 3) {
          chatgptresponse = await getValidResponse(prompt);
      
          if (chatgptresponse && chatgptresponse.length <= 280) {
            break;
          }
      
          attempts++;
        }
      
        if (attempts >= 3 || !chatgptresponse || chatgptresponse.length > 280) {
          return;
        }
        // console.log("----prompt results: ", chatgptresponse);
            
        
        const firstTwoCharacters = chatgptresponse.substring(0, 2);

        // Extract the last two characters
        const lastTwoCharacters = chatgptresponse.substring(chatgptresponse.length - 2);
        
        // Remove the first two characters and last two characters from chatgptresponse
        const modifiedResponse = chatgptresponse.substring(2, chatgptresponse.length - 2);
        
        await page.waitForTimeout(3000);
        await page.click('.css-1dbjc4n.r-16y2uox.r-bnwqim.r-13qz1uu.r-1g40b8q');
        // Type text into the element
        // console.log("div clicked");
    
        await page.waitForTimeout(3000);
        await page.keyboard.type(firstTwoCharacters);
        // console.log("keyboard typed");
        await page.waitForTimeout(3000);
        const inputElement = await page.$('div.public-DraftStyleDefault-block span');
        const textToPaste = modifiedResponse;
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
        // console.log("it's pasted");
        await page.keyboard.type(lastTwoCharacters);

        const gptPrompt = `I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
        Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc
    
        Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
        example output: {"positive_prompt": "", "negative_prompt": ""}
    
        Here is your first prompt: "Most realistic image that convey the idea: ${chatgptresponse}"
        Limit your response to 60 words for both prompts, provided in JSON format.
        Example output: {"positive_prompt": "", "negative_prompt": ""}.
    
        Response Must be only JSON , no other text should be there in the response. also, explanation is NOT required in the response
    
        Request: Response should be able to parse by a below javascript function:
        function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
        `

        const resp = await generateResponse(gptPrompt)
        // // console.log("=====image generation========", resp)
        let imageGenerationPrompt;
        // console.log("----ijmage prompt----", resp)
        try {
        // Try to parse the input directly.
         imageGenerationPrompt = JSON.parse(resp)
        } catch(e) {
            // console.log("=====errr----", e)
            const resp2 = await generateResponse(gptPrompt)
    
            try {
                imageGenerationPrompt = JSON.parse(resp2)
            } catch(e) {
                imageGenerationPrompt = {"positive_prompt": `Hyper realistic background image for ${userRequirement}, ${formMattedContextFromWebURL}`, "negative_prompt": " flying objects defying gravity, humans with multiple faces, disproportionate body parts such as deformed eyes or limbs, improbable color combinations, and explicit or offensive imagery"}
            }
        }

    
        // Define headers and body for POST request
        const myHeaders = {
        "accept": "application/json",
        "authorization": "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
        "content-type": "application/json"
        };

        const raw = JSON.stringify({
            "prompt": `${imageGenerationPrompt.positive_prompt}. 8K, hyper realistic`,
            "negative_prompt": imageGenerationPrompt.negative_prompt,
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

        const generationId = await generateImage(postOptions);

        if(generationId){
            const imageUrl = await getImageDetails(generationId);

            await downloadImage(imageUrl, 'output.jpg');
            const fileExists = fs.existsSync('output.jpg');

            if (fileExists) {
            // Simulate the paste operation by injecting JavaScript code
            // await page.evaluate((element, text) => {
            //     // Create a new event for the paste operation
            //     const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
            //     // Set the clipboard data for the paste event
            //     const clipboardData = {
            //         getData: () => text,
            //     };
            //     Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
            //     // Dispatch the paste event on the input element
            //     element.dispatchEvent(pasteEvent);
            // }, inputElement, textToPaste);
        
            const fileInput = await page.$('input[type="file"]');
        
            // Set the value of the file input to the file path
            const filePath = 'output.jpg';
            await fileInput.uploadFile(filePath);
        
            } else {
            // console.log('File does not exist');
            }
        
        }   
        
    

        // Wait for the file upload to complete or for any other necessary actions
        // Example: Wait for a success message


        // console.log("it's pasted");
        await page.waitForTimeout(10000);
        await page.click('[data-testid="tweetButtonInline"]');
        await page.evaluate(() => {
            const button = document.querySelector('div[data-testid="tweetButtonInline"]');
            button.click();
        });
        return;
        // console.log("the tweet button is clicked");
        } catch (err) {
            return;
            // console.log("error occured calling tweet function again", err);
        }
}


async function replyWithImage(page, userRequirement, contentFromURLIfAny) {
    // console.log("=====reply====")

            const randomScrolls = Math.floor(Math.random() * 10) + 1;
            // console.log("randomScrolls===>", randomScrolls)
            // Scroll down three times
            for (let i = 0; i < randomScrolls; i++) {
              await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
              });
              await page.waitForTimeout(1000); // Wait a bit for new tweets to load
            }
        
        
            const tweetsData = await page.evaluate(() => {
              // Get all root tweet elements
              const rootTweetElements = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
          
              // Extract tweet text, URLs, external links and tweet class
            // return rootTweetElements.map(rootElement => {
            //     const tweetTextElement = rootElement.querySelector('div[data-testid="tweetText"]');
            //     const tweetText = tweetTextElement ? tweetTextElement.textContent : null;
            //     const tweetClass = tweetTextElement ? tweetTextElement.className : null;
          
            //     const urlElement = rootElement.querySelector('a[href]');
            //     const urlIfAny = urlElement ? urlElement.href : null;
          
            //     const externalLinkElement = rootElement.querySelector('a[href][rel="noopener noreferrer nofollow"]');
            //     const externalLink = externalLinkElement ? externalLinkElement.href : null;
            //     if(!tweetText) return null;
            //     return {
            //       tweetText,
            //       tweetClass,
            //       urlIfAny,
            //       externalLink
            //     };
            //   }).filter(item => item !== null);   
            return rootTweetElements.map(rootElement => {
                const tweetTextElement = rootElement.querySelector('div[data-testid="tweetText"]');
                const parentDivElement = tweetTextElement ? tweetTextElement.parentElement : null;
              
                // Check if immediate next sibling of parentDivElement has aria-labelledby attribute
                if (parentDivElement && parentDivElement.nextElementSibling && parentDivElement.nextElementSibling.hasAttribute('aria-labelledby')) {
                  return null;
                }
              
                const tweetText = tweetTextElement ? tweetTextElement.textContent : null;
                const tweetBoxID = tweetTextElement ? tweetTextElement.id : null; // Grabbing the id attribute
              
                const urlElement = rootElement.querySelector('a[href]');
                const urlIfAny = urlElement ? urlElement.href : null;
              
                const externalLinkElement = rootElement.querySelector('a[href][rel="noopener noreferrer nofollow"]');
                const externalLink = externalLinkElement ? externalLinkElement.href : null;
                
                if (!tweetText) return null;
              
                return {
                  tweetText,
                  tweetBoxID, // Including the id in the return object
                  urlIfAny,
                  externalLink
                };
              }).filter(item => item !== null);
              
                         
            });
          
            if (tweetsData.length === 0) {
                return;
            }
            // console.log("tweetsData===>", tweetsData)
        
        
            const prompt = `
            ${userRequirement ? "For givne user requirement: "+ userRequirement : ''}
            Imagine you are a decision maker tasked with deciding whether to respond to a tweet or not.
            Given a list of tweets, select the top tweet that meets the following criteria: 
            - it is cool, easy-going, fun
            - impactful
            - it wouldn't cause any controversy if responded to with humor.
        
            sample Input: [{
              tweetText: "test",
              tweetBoxID: "test",
              urlIfAny: "test",
              externalLink: "test"
            },{}]
        
            *actual Tweet is the value of key 'tweetText'.
            
            After you pick the top tweet, generate a reply that meets the following criteria:
            - the maximum character length of reply tweet is 250 characters including the text after #.
            - The tweet should have genuine humor
            - The reply tweet should be positive and thought provoking
            - The reply tweet should be relatable to people

            Its important that tweetText should have full context, dont pick the tweet that you dont have full context.
            If all are not meeting the criteria, then pick a random one and generate a reply that meets the criteria.
        
        
            Example Output: {
              tweetText: "test",
              tweetBoxID: "test",
              urlIfAny: "test",
              externalLink: "test",
              reply: "test"
            }
            
                
            Response Must be only JSON. No other text should be there in response. No explanation is required.
        
            Request: Response should be able to parse by a below javascript function:
            function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
            Tweets array:
            ${JSON.stringify(tweetsData)}
            `
                
            // console.log("----prompt: ", prompt);
        
            let chatgptresponse1 = await generateResponse(prompt, false);
        
            // console.log("chatgptresponse1------- ", chatgptresponse1);
            let replyTweet;
            try{
                replyTweet = JSON.parse(chatgptresponse1);
                // console.log("replyTweet------- ", replyTweet);

            }catch(err){
                let chatgptresponse1 = await generateResponse(prompt, false);
        
                // console.log("chatgptresponse2------- ", chatgptresponse1);
                try{
                    replyTweet = JSON.parse(chatgptresponse1);
                    // console.log("replyTweet------- ", replyTweet);

                }catch(err){
                    return;
                    // console.log("error occured calling tweet function again", err);
                }


                
                // console.log("error occured calling tweet function again", err);
            }
            if(!replyTweet){
                return;
            }
            if(replyTweet && replyTweet.tweetBoxID === 'N/A'){
                return;
            }
            if(replyTweet && !replyTweet.tweetBoxID){
                return;
            }

            if(replyTweet && !replyTweet.reply){
                return;
            }
            if(replyTweet && replyTweet.reply && replyTweet.reply.length > 250){
                return;
            }

            if(replyTweet && replyTweet.reply && replyTweet.reply.indexOf(disclaimer[0]) !== -1){
                return;
            }
            await page.waitForTimeout(2000);
            // await page.click('.css-1dbjc4n.r-1awozwy.r-onrtq4.r-18kxxzh.r-1b7u577');
            await page.click(`#${replyTweet.tweetBoxID}`);
            // Extract the text from the tweet
            await page.waitForTimeout(3000);
            let textContent = await page.evaluate(() => {
                const div = document.querySelector('div[data-testid="tweetText"]');
                return div.textContent;
            });
            
            let chatgptresponse = replyTweet.reply;
            const firstTwoCharacters = chatgptresponse.substring(0, 2);

            // Extract the last two characters
            const lastTwoCharacters = chatgptresponse.substring(chatgptresponse.length - 2);
            
            // Remove the first two characters and last two characters from chatgptresponse
            const modifiedResponse = chatgptresponse.substring(2, chatgptresponse.length - 2);
            
            await page.waitForTimeout(3000);
            await page.click('.css-1dbjc4n.r-16y2uox.r-bnwqim.r-13qz1uu.r-1g40b8q');
            // Type text into the element
            // console.log("div clicked");
            
            await page.waitForTimeout(3000);
            await page.keyboard.type(firstTwoCharacters);
            // console.log("keyboard typed");
            await page.waitForTimeout(3000);
            const inputElement = await page.$('div.public-DraftStyleDefault-block span');
            const textToPaste = modifiedResponse;
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
            // console.log("it's pasted");

            await page.keyboard.type(lastTwoCharacters);

            const gptPrompt = `I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
            Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc
        
            Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
            example output: {"positive_prompt": "", "negative_prompt": ""}
        
            Here is your first prompt: "Most realistic image that convey the idea ${chatgptresponse}"
            Limit your response to 60 words for both prompts, provided in JSON format.
            Example output: {"positive_prompt": "", "negative_prompt": ""}.
        
            Response Must be only JSON , no other text should be there.
        
            Request: Response should be able to parse by a below javascript function:
            function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
            `
    
            const resp = await generateResponse(gptPrompt)
            // // console.log("=====image generation========", resp)
            let imageGenerationPrompt;
            // console.log("----ijmage prompt----", resp)
            try {
            // Try to parse the input directly.
            imageGenerationPrompt = JSON.parse(resp)
            } catch(e) {
                // console.log("=====errr----", e)
                const resp2 = await generateResponse(gptPrompt)
        
            try {
                imageGenerationPrompt = JSON.parse(resp2)
            } catch(e) {
                imageGenerationPrompt = {"positive_prompt": `Hyper realistic background image for ${userRequirement}, ${formMattedContextFromWebURL}`, "negative_prompt": " flying objects defying gravity, humans with multiple faces, disproportionate body parts such as deformed eyes or limbs, improbable color combinations, and explicit or offensive imagery"}
            }
            }
    
        
            // Define headers and body for POST request
            const myHeaders = {
            "accept": "application/json",
            "authorization": "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
            "content-type": "application/json"
            };
    
            const raw = JSON.stringify({
                "prompt": `${imageGenerationPrompt.positive_prompt}. 8K, hyper realistic`,
                "negative_prompt": imageGenerationPrompt.negative_prompt,
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
    
        const generationId = await generateImage(postOptions);
    
        if(generationId){
            const imageUrl = await getImageDetails(generationId);
    
            await downloadImage(imageUrl, 'output.jpg');
            const fileExists = fs.existsSync('output.jpg');
    
            if (fileExists) {
            // Simulate the paste operation by injecting JavaScript code
            // await page.evaluate((element, text) => {
            //     // Create a new event for the paste operation
            //     const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
            //     // Set the clipboard data for the paste event
            //     const clipboardData = {
            //         getData: () => text,
            //     };
            //     Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
            //     // Dispatch the paste event on the input element
            //     element.dispatchEvent(pasteEvent);
            // }, inputElement, textToPaste);
        
            const fileInput = await page.$('input[type="file"]');
        
            // Set the value of the file input to the file path
            const filePath = 'output.jpg';
            await fileInput.uploadFile(filePath);
        
            } else {
            // console.log('File does not exist');
            }
        
        }   
        

            
            await page.waitForTimeout(10000);

            await page.click('[data-testid="tweetButtonInline"]');
            await page.evaluate(() => {
                const button = document.querySelector('div[data-testid="tweetButtonInline"]');
                button.click();
            });
            return;
        // console.log("the tweet button is clicked");
}

module.exports = {
    tweet, 
    tweetWithImage,
    replyWithImage,
    reply,
}