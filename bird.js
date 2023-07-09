const puppeteer = require("puppeteer-core");
const { generateResponse } = require("../../../utils/api/apiCall");
const os = require("os");

const initBird = async () => {
    try {
        const username = os.userInfo().username;
        console.log(`Current username is ${username}`);

        browser = await puppeteer.launch({
            executablePath:
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            userDataDir:
                "/Users/hari/Library/Application Support/Google/Chrome/Profile 1", // Replace with your actual user data directory path
            slowMo: 1000,
            headless: false,
            defaultViewport: null,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            permissions: ["clipboard-read", "clipboard-write"],
            ignoreDefaultArgs: ["--enable-automation"],
        });

        let page = await browser.newPage();
        const pages = await browser.pages();

        // If there are open pages, close the first one
        if (pages.length > 0) {
            await pages[0].close();
        }
        await page.goto("https://twitter.com/home");
        //await page.waitForTimeout(10000);
        await page.waitForSelector("div.public-DraftStyleDefault-block span", {
            timeout: 180000,
        });
    } catch (err) {
        return `An error occurred during API call: ${err}`;
    }

    // const init = () => {
    //     try {

    //         while (true) {
    //             launchBrowser();
    //             const curentTime = new Date().getTime();

    //             if whatActionTODO() === "tweet" {
    //                 tweet();
    //             }
    //             if whatActionTODO() === "reply" {
    //                 await reply();
    //             }
    //             if whatActionTODO() === "follow" {
    //                 follow();
    //             }
    //         }
    //     } catch (err) {
    //         if (err === isItUserInterupted(err)) {
    //             console.log("User Interupted");
    //             await sleep(100000)
    //             closExisitingBrowser();
    //             launchNewBrowser();
    //             init();
    //         }
    //     }
    // };
    // const tweet = () => { };
    // const follow = () => { };
    // const reply = () => { };
    // const whatActionTODO = () => {
    //     return "tweet";
    // }
    // const isItUserInterupted(erro) = () => {

    // }
    // closExisitingBrowser();
    // launchNewBrowser();

    // const browser = await puppeteer.launch({
    //   executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    //   userDataDir: '/Users/hari/Library/Application Support/Google/Chrome/Profile 1', // Replace with your actual user data directory path
    //   slowMo: 1000,
    //   headless: false,
    //   defaultViewport: null,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    //   const page = await browser.newPage();
    //   await page.goto('https://twitter.com');

    //   async function processTweets(page, count) {

    //     for (i = 0; i < count; i++) {
    //       try {
    //         await page.click('svg.r-1nao33i', isPuppeteerClick=true);
    //         await page.reload();
    //         console.log("Tweet ",i+1);
    //         await page.waitForTimeout(2000);
    //         await page.click('.css-1dbjc4n.r-1awozwy.r-onrtq4.r-18kxxzh.r-1b7u577');

    //         // await page.waitForSelector('[data-testid="tweetText"]');

    //         // // Extract the text from the div.
    //         // const tweetTexts = await page.evaluate(() => {
    //         //   const tweetNodes = Array.from(document.querySelectorAll('[data-testid="tweetText"]'));
    //         //   return tweetNodes.map(node => node.innerText);
    //         // });

    //         // console.log(tweetTexts);

    //         // Extract the text from the tweet
    //         await page.waitForTimeout(1000);

    //         let textContent = await page.evaluate(() => {
    //           const div = document.querySelector('div[data-testid="tweetText"]');
    //           return div.textContent;
    //         });

    //         console.log(textContent);
    //         let chatgptresponse = await generateResponse(`Follow the below conditions to generate a reply that I could reply for this tweet in less than 10 characters. Conditions:
    //         The tweet should be positive and thought provoking, The tweet should have popular existing hashtags,
    //         The tweet should be relatable to people, The tweet should have geniune humor,
    //         The tweet should mention viral trends if possible, The tweet is : ${textContent}`, false);
    //         console.log("----chatgpt results: ", chatgptresponse);

    //         const divSelector = 'div[data-offset-key="2uu25-0-0"]';
    //         const divElement = await page.$(divSelector);

    //         await page.click('.public-DraftStyleDefault-block');
    //         //await page.keyboard.type("'");
    //         //await page.keyboard.type("'");
    //         // const options = { delay: 2 };
    //         await page.type('div[data-testid="tweetTextarea_0"]', chatgptresponse, options);
    //         //await db.put({
    //           //tweet: chatgptresponse,
    //           //time: Date.now()
    //         //});

    //         // Wait for any asynchronous tasks to complete
    //         await page.waitForTimeout(2000);
    //         await page.click('[data-testid="tweetButtonInline"]');

    //         await page.waitForTimeout(1000);
    //       } catch (error) {
    //         console.error('An error occurred:', error);
    //         console.error('You have clicked while the bot is running. The bot will restart itself in 20 seconds');
    //         await page.waitForTimeout(20000);
    //       }
    //   }
    //   }

    // const goal = "Promote AI and ML in a positive way";
    // const nextTimeToTweet = randomsecsonnexthour();

    // while (true) {
    // do scroll

    // get random Tweet from home page(get length, get a random number of that length
    // click and reply

    //   sleep(randomTimeToSleepNotMoreThan10Mins());
    // }

    //   const count = 100;
    //   await processTweets(page, count);

    // // async


}

initBird();