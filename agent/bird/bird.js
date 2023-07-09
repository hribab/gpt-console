const puppeteer = require("puppeteer-core");
const { launchBrowser, getRandomAction,  performAction} = require("./utils/initActions.js");
const os = require("os");
const { exec, spawn } = require("child_process");
const fs = require('fs');


const initBird = async () => {
    try {
        launchBrowser();
        const randoAction = getRandomAction();
        performAction(randoAction)
    } catch (err) {
        return `An error occurred during API call: ${err}`;
    }
}


module.exports = {
    initBird
}