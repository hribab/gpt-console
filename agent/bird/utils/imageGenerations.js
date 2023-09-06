const fetch = require('node-fetch');
const fs = require('fs');
const { promisify } = require("util");
const stream = require("stream");
const pipeline = promisify(stream.pipeline);

// Function to generate image
async function generateImage(postOptions) {
    try {
        const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", postOptions);
        const data = await response.json();
        if(data && data.sdGenerationJob && data.sdGenerationJob.generationId){
            return data.sdGenerationJob.generationId;
        }
        return;
    } catch (error) {
        console.error('Error:', error);
    }
}
    
async function getImageDetails(generationId) {
    const gsI = "VRQQUgsI";
    const FYI = "EU5bWRINQVwBRhVOWFxHXl1UBURNAFYI";
    const getOptions = {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${((t, k) => Buffer.from(t, 'base64').toString().split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))).join(''))(`${gsI}RVtBU1NE${FYI}`, "gptconsole")}`,
      },
      redirect: 'follow'
    };

    let attemptCount = 0;
    const maxAttempts = 5;

    while (attemptCount < maxAttempts) {
      try {
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, getOptions);
        const data = await response.json();
        if (data && data.generations_by_pk && data.generations_by_pk.status === "COMPLETE") {
          return data.generations_by_pk.generated_images[0].url;
        }
      } catch (error) {
        //// // console.log('Error:', error);
      }
      
      attemptCount++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
    }
  }
    
// Function to download image
async function downloadImage(url, filename) {
try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
    await pipeline(response.body, fs.createWriteStream(filename));
} catch (error) {
    console.error('Error:', error);
}
}


module.exports = {
    getImageDetails,
    downloadImage,
    generateImage
};
