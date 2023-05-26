const { Configuration, OpenAIApi } = require("openai");


async function generateResponse(prompt, codeRelated = false) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY 
      });
    const openai = new OpenAIApi(configuration);
    if (!prompt) {
      return;
    }
    let model = "gpt-4"

    if (codeRelated) {
      model = "text-davinci-002"
    }
    try {
      const completion = await openai.createChatCompletion({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });
  
      const response = completion.data.choices[0].message.content.trim();
      return response;
    } catch (error) {
      return `OpenAI API Error - ${error.message}`;
    }
}

module.exports = {
    generateResponse
}