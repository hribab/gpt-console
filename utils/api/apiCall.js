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
      console.log("=========", error)
      return `error`;
    }
}


async function generateResponseWithFunctions(prompt, codeRelated = false) {
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
      messages: [{ role: "functions", 

      functions: [
        {
            "name": "extract_reply_tweetClass",
            "description": "Extract the reply tweet class",
            "parameters": {
                "type": "object",
                "properties": {
                    "response": {
                        "type": "object",
                        "description": "The city, place or any location" //, e.g. San Francisco, CA"
                    },
                   
                },
                "required": ["response"]
            }
        }
      ]
    }],
    });

    console.log("=====frst====", completion.data.choices[0])
    const response = completion.data.choices[0].message.content.trim();
    return response;
} catch (error) {
    console.log("===err======", error)
    return `error`;
  }
}
module.exports = {
  generateResponse,
  generateResponseWithFunctions
}