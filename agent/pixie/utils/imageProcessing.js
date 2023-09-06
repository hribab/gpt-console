const { pixieLLM } = require("../../../utils/api/apiCall");
const fetch = require("node-fetch");
const stream = require("stream");
const fs = require("fs");
const { promisify } = require("util");
const path = require("path");

const util = require("util");
const pipeline = promisify(stream.pipeline);



function extractImagePaths(code) {
    const regex = /require\(["']([^"']+)["']\)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(code)) !== null) {
        matches.push(match[1]);
    }
    return matches;
  }
// Function to get image details
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
      // Ensure the directory exists
     // // console.log("==creating=filename====", filename)
      // Split the path into its parts
      let parts = filename.split(path.sep);
      // Pop the last part of the path array which should be the filename
      parts.pop();

      let dirPath = '';
      for(let part of parts) {
          dirPath = path.join(dirPath, part);
          if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath);
          }
      }


      const response = await fetch(url);
      if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
      await pipeline(response.body, fs.createWriteStream(filename));
      
    } catch (error) {
      // // console.log('Error:', error);
    }
  }

async function downloadComponentImages(userRequirement, outputImagePath, formMattedContextFromWebURL) {
  try {
  const gptPrompt = `
  I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
  Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc

  Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
  example output: {"positive_prompt": "", "negative_prompt": ""}

  Here is your first prompt: "Background image for landing page of user requirement:  ${userRequirement} ${formMattedContextFromWebURL}"
  Limit your response to 60 words for both prompts, provided in JSON format.
  Example output: {"positive_prompt": "", "negative_prompt": ""}.

  Response Must be only JSON , no other text should be there.

  Request: Response should be able to parse by a below javascript function:
    function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
  `
  const resp = await pixieLLM(gptPrompt)
  // console.log("=====image generation========", resp)
  let imageGenerationPrompt;
  
  try {
    // Try to parse the input directly.
    imageGenerationPrompt = JSON.parse(resp)
  } catch(e) {
    const gptPrompt = `
      I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
      Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc
    
      Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
      example output: {"positive_prompt": "", "negative_prompt": ""}
    
      Here is your first prompt: "Background image for landing page of user requirement:  ${userRequirement} ${formMattedContextFromWebURL}"
      Limit your response to 60 words for both prompts, provided in JSON format.
      Example output: {"positive_prompt": "", "negative_prompt": ""}.

      Response Must be only JSON , no other text should be there.

      Request: Response should be able to parse by a below javascript function:
        function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
    `
    const resp = await pixieLLM(gptPrompt)

    try {
      imageGenerationPrompt = JSON.parse(resp)
    } catch(e) {
      imageGenerationPrompt = {"positive_prompt": `Hyper realistic background image for ${userRequirement}, ${formMattedContextFromWebURL}`, "negative_prompt": " flying objects defying gravity, humans with multiple faces, disproportionate body parts such as deformed eyes or limbs, improbable color combinations, and explicit or offensive imagery"}
    }
  }

  // console.log("=====image generation========", imageGenerationPrompt)

  // // // console.log("===image prompt ====", gptPrompt)
  // Define headers and body for POST request
  const gsI = "VRQQUgsI";
  const FYI = "EU5bWRINQVwBRhVOWFxHXl1UBURNAFYI";
  const myHeaders = {
    "accept": "application/json",
    "authorization": `Bearer ${((t, k) => Buffer.from(t, 'base64').toString().split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))).join(''))(`${gsI}RVtBU1NE${FYI}`, "gptconsole")}`,
    "content-type": "application/json"
  };
 
  if(!imageGenerationPrompt || (imageGenerationPrompt && (!imageGenerationPrompt.negative_prompt || !imageGenerationPrompt.positive_prompt) )){
    // console.log("==empty==imageGenerationPrompt=====")
    return;
  }
  // // console.log("===image prompt resones====", response)
  const raw = JSON.stringify({
    "prompt": `${imageGenerationPrompt.positive_prompt}. 8K, hyper realistic`,
    "negative_prompt":  `${imageGenerationPrompt.negative_prompt}, Mountains, Clouds, Lake`,
    "width": 1024,
    "height": 1024,
    "modelId": "291be633-cb24-434f-898f-e662799936ad",
    "guidance_scale": 7,
    "presetStyle": "LEONARDO",
    "num_images": 1
  });

  const postOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  // Function to generate image
  async function generateImage() {
    try {
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", postOptions);
      const data = await response.json();
      if(data.sdGenerationJob && data.sdGenerationJob.generationId){
        return data.sdGenerationJob.generationId;
      }else{
        const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", postOptions);
        const data = await response.json();
        if(data.sdGenerationJob && data.sdGenerationJob.generationId){
          return data.sdGenerationJob.generationId;
        }else{
          return;
        }
      }
    } catch (error) {
      console.log("=====err---", error)
      return;
      // // console.log('Error:', error);
    }
  }


 
  const generationId = await generateImage();
  // // console.log("===generationId====", generationId)
  if(!generationId){
    return;
  }
  const imageUrl = await getImageDetails(generationId);
  if(!imageUrl){
    return;
  }
  // // console.log("===imageUrl====", imageUrl)
  await downloadImage(imageUrl, outputImagePath);
  }catch(e) {
    console.log("======eee========", e)
    return false

  }
  return true;
  }



  module.exports = {
    extractImagePaths,
    downloadComponentImages,
    downloadImage,
    getImageDetails
};
