const { initPixie } = require("../pixie.js");

function startPixie(req) {
  try {
    initPixie(req);
  } catch (error) {
    //TODO: handle exception
    console.log("=====errror===", error);
  }
}

module.exports = {
  startPixie,
};
