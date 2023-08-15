const puppeteer = require("puppeteer-core");
const os = require("os");
const fs = require('fs');


const getBrowserInstances = async () => {
    //TODO: Browser error when already launched.
    const username = os.userInfo().username;
    // console.log("it's launching");
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
    // console.log("profileName", profileName)

    const browser = await puppeteer.launch({
        executablePath: executablePath,
        userDataDir: `${userDataDir}${profileName}`,
        slowMo: 1000,
        headless: false,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        permissions: ["clipboard-read", "clipboard-write"],
        ignoreDefaultArgs: ["--enable-automation"],
    });
    try{
        // console.log("opening the page");
        let page = await browser.newPage();
        const pages = await browser.pages();
        // console.log("pages:",pages);
       return pages
    }
    catch(err){
        // console.log("error-------", err);
        return
    }
}

module.exports = {
    getBrowserInstances
}