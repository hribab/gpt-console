const { stopBird } = require("../bird.js");

async function stopBirdOperation(callback) {

  try {
      await stopBird(callback)
  } catch (error) {
    return;
    // console.log("=====errror===", error);
  }
}

module.exports = {
  stopBirdOperation
}