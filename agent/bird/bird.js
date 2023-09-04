const { launchBrowser,  performAction, isValidURL} = require("./utils/initActions.js");
const { getBrowserInstances } = require("./utils/stopActions.js");
const spinners = require("cli-spinners");

const { getTwitterAction, extractContentFromFirstURL, getTheOperationFromPrompt } = require("./utils/misc.js");
let twitterActions;
let allTweets = {"tweets": []};
const MAX_ACTIONS = 5;
const browserInstances = [];

const initBird = async (userRequirement, callback) => {
    // console.log("userRequirement", userRequirement);
    const spinner = spinners.dots;
    let interval;
    try {
        process.stdout.write('\r');
        interval = setInterval(() => {
        process.stdout.write(`\r${spinner.frames[spinner.interval % spinner.frames.length]}`);
        spinner.interval++;
        }, spinner.frameLength);
        // callback(null);
        // get the content if there is a website
        const contentFromFirstURL = await extractContentFromFirstURL(userRequirement)
        // console.log("------contentFromFirstURL------------", contentFromFirstURL);
        const page = await launchBrowser(browserInstances);
        await page.waitForTimeout(1000);
        clearInterval(interval);
        process.stdout.write('\r');

        const isURLOnly = isValidURL(userRequirement)
        // console.log("=====isURLOnly========", isURLOnly)
        if(userRequirement && !isURLOnly){

            const theOperationObject = await getTheOperationFromPrompt(userRequirement)
            // console.log("documentationOnly", documentationOnly)
            if(theOperationObject && theOperationObject.action && theOperationObject.action.toLowerCase() == 'tweet'){
                try{
                    process.stdout.write(`\x1b[32mSure thing! 😎 I'm gearing up to tweet\x1b[0m\n`);
                   
                    
                    let theTweetCount;
                    if (typeof theOperationObject.count === "string") {
                        theTweetCount = 5;
                    }
                    if(theOperationObject.count > 10){
                        process.stdout.write(`\n\x1b[32mJust so you know, I'm limited to 10 tweets at a time right now\x1b[0m \n`);
                        theTweetCount = 10;
                    }
                    if(typeof theOperationObject.count === "number" && theOperationObject.count < 10){
                        theTweetCount = theOperationObject.count;
                    }
                    process.stdout.write(`\x1b[32mI'll fire off ${theTweetCount} tweets and then take a breather. 🚀\x1b[0m \n`);
                    process.stdout.write(`\x1b[31m To stop Bird at any time, run 'bird stop'. \x1b[0m \n`);
              
                    callback(null);
                    for (let index = 0; index < theTweetCount; index++) {
                        let actionType = Math.random() < 0.7 ? "tweetWithImage" : "tweet";
                        await performAction(page, actionType, userRequirement, contentFromFirstURL, allTweets);
                    }
                    for (const browser of browserInstances) {
                        await browser.close();
                    }
                                    
                }catch(e){
                    for (const browser of browserInstances) {
                        await browser.close();
                    }
                    return;
                    // console.log("e-----", e)
                }
                return;
            }
            if(theOperationObject && theOperationObject.action && theOperationObject.action.toLowerCase() == 'reply'){
                try{
                    let theTweetCount;
                    if (typeof theOperationObject.count === "string") {
                        theTweetCount = 5;
                    }
                    process.stdout.write(`\x1b[32mSure thing! 😎 I'm gearing up to reply\x1b[0m\n`);

                    if(theOperationObject.count > 10){
                        process.stdout.write(`\n\x1b[32mJust so you know, I'm limited to 10 replies at a time right now\x1b[0m \n`);
                        theTweetCount = 10;
                    }
                    if(typeof theOperationObject.count === "number" && theOperationObject.count < 10){
                        theTweetCount = theOperationObject.count;
                    }
                    process.stdout.write(`\x1b[32mI'll fire off ${theTweetCount} tweets and then take a breather. 🚀\x1b[0m \n`);
                    process.stdout.write(`\x1b[31m To stop Bird at any time, run 'bird stop'. \x1b[0m \n`);
              
                    callback(null);
                    for (let index = 0; index < theTweetCount; index++) {
                        let actionType = Math.random() < 0.7 ? "replyWithImage" : "reply";
                        await performAction(page, actionType, userRequirement, contentFromFirstURL);
                    }

                    for (const browser of browserInstances) {
                        await browser.close();
                    }
                                    
                }catch(e){
                    return;
                    // console.log("e-----", e)
                }
            return;
            }
            if(theOperationObject && theOperationObject.action && (theOperationObject.action.toLowerCase() != 'reply' || theOperationObject.action.toLowerCase() != 'tweet')){
                process.stdout.write(`\n\x1b[32mApologies, unable to process prompt. Closing the browser. Please try again. \x1b[0m \n`);
                for (const browser of browserInstances) {
                    await browser.close();
                }
                callback(null);
                return;
            }
        }         
        process.stdout.write(`\n\x1b[32m I'll handle tweeting and replying responsibly 😎. Stay relaxed, I've got this \x1b[0m \n`);
        process.stdout.write(`\x1b[32m I'll do 5 actions (tweets and replies) and stop automatically 🚀\x1b[0m \n`);
        process.stdout.write(`\x1b[31m To stop Bird at any time, run 'bird stop'. \x1b[0m \n`);
  
        callback(null);
        if(userRequirement && contentFromFirstURL){
            await performAction(page, "tweetWithImage", userRequirement, contentFromFirstURL);
        }
        let counter = 0;
        while (counter < MAX_ACTIONS) {
            try {
            twitterActions = getTwitterAction();
            switch (twitterActions) {
                case 'tweet':
                await performAction(page, "tweet", userRequirement, contentFromFirstURL, allTweets);
                break;
                case 'tweetWithImage':
                await performAction(page, "tweetWithImage", userRequirement, contentFromFirstURL, allTweets);
                break;
                case 'reply':
                await performAction(page, "reply", userRequirement, contentFromFirstURL);
                break;
                case 'replyWithImage':
                await performAction(page, "replyWithImage", userRequirement, contentFromFirstURL);
                break;
                default:
                break;
            }
            counter += 1;
            } catch (e) {
            return;
            }
        }

        try {
            for (const browser of browserInstances) {
                await browser.close();
            }
            browserInstances.length = 0; // Clear the array
            callback(null);
        } catch (err) {
            return;
        }
        return;

    } catch (err) {
        // console.log("====errr---", err)
        clearInterval(interval);
        // process.stdout.write('\r');
        // // console.log("error-------", err);
        return;// `An error occurred during API call: ${err}`;
    }
}

const stopBird = async (callback) => {
    // console.log("=browserInstances====", browserInstances)
    try {
        for (const browser of browserInstances) {
            await browser.close();
        }
        browserInstances.length = 0; // Clear the array
        callback(null);
    } catch (err) {
        // console.log("error-------", err);
        return `An error occurred during API call: ${err}`;
    }
}
module.exports = {
    initBird,
    stopBird,
}