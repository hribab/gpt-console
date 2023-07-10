const GENERATE_MESSAGING = (userRequirement, code) => `
Input: I am passing entire code of generic header section of a landing page. 
Please update only messaging for JSX code for user requirement: ${userRequirement}
Return back same code exactly, only change happened should be text, nothing else should be changed.
code: ${code}
`;

const PROMPT_GENERATOR = (userRequirement) => `I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc

Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
example output: {"positive_prompt": "", "negative_prompt": ""}

Here is your first prompt: "Elegant Background image for landing page of user requirement:  ${userRequirement}"

Main requirement is response must be in json
`;

//TODO
const SECTIONS_GENERATOR = (userRequirement) => ``;

module.exports = {
  GENERATE_MESSAGING,
  PROMPT_GENERATOR,
  SECTIONS_GENERATOR
};
