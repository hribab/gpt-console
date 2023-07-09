const puppeteer = require("puppeteer-core");
const os = require("os");
const fs = require('fs');
const { tweet, tweetWithImage, reply } = require("./twitterActions.js");

const launchBrowser = async () => {
    const username = os.userInfo().username;
    let userDataDir, executablePath, profileName;
    if (os.platform() === "darwin") {
        userDataDir = `/Users/${username}/Library/Application Support/Google/Chrome/`;
        executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } else if (os.platform() === "win32") {
        userDataDir = `C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome\\User Data\\`;
        executablePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
    } else if (os.platform() === "linux") {
        userDataDir = `/home/${username}/.config/google-chrome/`;
        executablePath = "/usr/bin/google-chrome"
    } else {
        // handle failure
    }
    const files = fs.readdirSync(userDataDir);

    const profileFile = files.find(file => file.startsWith('Profile'));
          
    if (profileFile) {
        profileName = profileFile
    } else {
        profileName = "Default"
    }

    browser = await puppeteer.launch({
        executablePath: executablePath,
        userDataDir: `${userDataDir}${profileName}`,
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
}

const getRandomAction = async () => {
    const options = ['tweet', 'reply', 'tweetWithImage', 'replyWithImage'];//, 'follow'];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];    
}

const performAction = async (action) => {
    switch (action) {
        case "tweet":
            await tweet();
            break;
        case "tweetWithImage":
            await tweetWithImage();
            break
        case "reply":
            await reply();
            break
        case "replyWithImage":
            await replyWithImage();
            break;   
    }
}

module.exports = {
    launchBrowser, 
    getRandomAction,
    performAction,
}