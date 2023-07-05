const { generateResponse } = require("../api/apiCall");

function updateSectionCode(userRequirement, section, page, code) {
  console.log("section page user requirement", section, page, userRequirement)
  const prompt = `i want you to update the text in below ${section} section code of 
    ${page} page for the requirement ${userRequirement} 
    ${JSON.stringify(code)}
    Give me updated code and don't include any explanation. 
    `;
  return generateResponse(prompt);
};

module.exports = {
  updateSectionCode
}
