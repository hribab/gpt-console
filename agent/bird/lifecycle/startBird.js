const puppeteer = require('puppeteer-core');
const { generateResponse } = require("../../../utils/api/apiCall");
const { initBird } = require("../bird.js");

const fetch = require('node-fetch');
const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');
const pm2 = require('pm2');

const pipeline = promisify(stream.pipeline);

const os = require('os');

function startBird() {

try {
    initBird()
} catch (error) {
  console.log("=====errror===", error);
}
}

module.exports = {
    startBird
}



