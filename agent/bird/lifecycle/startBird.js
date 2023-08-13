const { initBird } = require("../bird.js");
async function startBird(userRequirement, callback) {
  try {
    const page = await initBird(userRequirement, callback)
    return page;
  } catch (error) {
    return; 
   // console.log("=====errror===", error);
  }
}

module.exports = {
    startBird
}


