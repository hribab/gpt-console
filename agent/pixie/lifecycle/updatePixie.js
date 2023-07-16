const { 
    updatePixieOperation
 } = require("../pixie.js");

async function updatePixie(input, callback) {
    console.log("=====updatePixie=====", input);
    updatePixieOperation(input, callback)
}
    
module.exports = {   
    updatePixie
}