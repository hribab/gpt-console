const { launchBrowser,  performAction} = require("./utils/initActions.js");
const { getBrowserInstances } = require("./utils/stopActions.js");

const { getTwitterAction, extractContentFromFirstURL } = require("./utils/misc.js");
let twitterActions;
const MAX_ACTIONS = 5;
const browserInstances = [];

const initBird = async (userRequirement, callback) => {
    // console.log("userRequirement", userRequirement);
    try {
        process.stdout.write(`\n\x1b[32m I'll handle tweeting and replying responsibly. Stay relaxed, I've got this \x1b[0m \n`);
        process.stdout.write(`\x1b[32m I'll do 5 actions (tweets and replies) and stop automatically \x1b[0m \n`);
        process.stdout.write(`\x1b[31m To stop Bird at any time, run 'bird stop'. \x1b[0m \n`);
  
        callback(null);
        // get the content if there is a website 
        const contentFromFirstURL = await extractContentFromFirstURL(userRequirement)
        // console.log("------contentFromFirstURL------------", contentFromFirstURL);
        const page = await launchBrowser(browserInstances);
        await page.waitForTimeout(1000);
    
        if(userRequirement && contentFromFirstURL){
            await performAction(page, "tweetWithImage", userRequirement, contentFromFirstURL);
        }
        let counter = 0;
        while(true){
            twitterActions = getTwitterAction();
            // console.log("twitterActions===---------", twitterActions);
            switch (twitterActions) {
                case 'tweet':
                    // console.log('Selected Action is tweet.');
                    await performAction(page, "tweet", userRequirement, contentFromFirstURL);
                    break;
                case 'tweetWithImage':
                    // console.log('Selected Action is tweet with image');
                    await performAction(page, "tweetWithImage", userRequirement, contentFromFirstURL);
                    break;
                case 'reply':
                    // console.log('Selected Action is reply');
                    await performAction(page, "reply", userRequirement, contentFromFirstURL);
                    break;
                case 'replyWithImage':
                    // console.log('Selected Action is reply with image');
                    await performAction(page, "replyWithImage", userRequirement, contentFromFirstURL);
                    break;
                default:
                    // console.log('Selected Action is unknown.');
            }
            counter = counter + 1;
            // console.log("the count of actions is: ",counter);
            if(counter === MAX_ACTIONS){
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
                return;
            }
        }
        return page;
    } catch (err) {
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