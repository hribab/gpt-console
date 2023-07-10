const fetch = require("node-fetch");
const stream = require("stream");
const fs = require("fs");
const unzipper = require("unzipper");
const { promisify } = require("util");
const path = require("path");
// const fs = require("fs").promises;
const generate = require("@babel/generator").default;
const t = require("@babel/types");
const { exec } = require("child_process");
const { generateResponse } = require("../../../utils/api/apiCall");


const fse = require("fs-extra");

const util = require("util");
const { copySync, removeSync } = require("fs-extra");
const streamPipeline = util.promisify(require("stream").pipeline);
const pipeline = promisify(stream.pipeline);

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;



//npm install in your project

async function runCommand(command, directory) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: directory }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

async function executeCommand() {
  try {
    const result = await runCommand("yarn install", "./yourproject");
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
async function downloadAndUnzip(url) {
  const response = await fetch(url);

  if (!response.ok)
    throw new Error(`unexpected response ${response.statusText}`);

  await pipeline(response.body, unzipper.Extract({ path: "." }));

  // Remove the __MACOSX directory
  try {
    await exec("rm -rf __MACOSX");
    console.log(`__MACOSX directory removed.`);
  } catch (err) {
    console.error(`exec error: ${err}`);
  }

  await executeCommand();
  console.log("Extraction complete.");
}

async function updateLandingPage(sections) {
  // let sections = {
  //   header: true,
  //   feature: false,
  //   blogs: false,
  //   teams: false,
  //   projects: false,
  //   pricing: false,
  //   testimonial: false,
  //   contactus: false,
  //   footer: false,
  // };
  let code;
  try {
    code = fs.readFileSync(
      "yourproject/src/views/LandingPage.js",
      "utf8"
    );
  } catch (err) {
    console.error(err);
    return;
  }

  let ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  traverse(ast, {
    enter(path) {
      if (path.isProgram()) {
        for (let section in sections) {
          if (sections[section]) {
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [
                  t.importDefaultSpecifier(
                    t.identifier(
                      section.charAt(0).toUpperCase() + section.slice(1)
                    )
                  ),
                ],
                t.stringLiteral(
                  `components/Landingpage/${
                    section.charAt(0).toUpperCase() + section.slice(1)
                  }.js`
                )
              )
            );
          }
        }
      } else if (t.isJSXFragment(path.node)) {
        path.node.children = Object.keys(sections)
          .filter((section) => sections[section])
          .map((section) =>
            t.jsxElement(
              t.jsxOpeningElement(
                t.jsxIdentifier(
                  section.charAt(0).toUpperCase() + section.slice(1)
                ),
                [],
                true
              ),
              null,
              [],
              true
            )
          );
      }
    },
  });

  let output = generate(ast).code;
  // Write the output back into the file
  try {
    fs.writeFileSync(
      "yourproject/src/views/LandingPage.js",
      output,
      "utf8"
    );
    console.log("File successfully written!");
  } catch (err) {
    console.error(err);
  }
}

async function downloadCodeFile(url, destinationPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }
  await fse.ensureDir(path.dirname(destinationPath));

  await streamPipeline(response.body, fs.createWriteStream(destinationPath));
  console.log(`File downloaded to ${destinationPath}`);
}

async function generateMessaging(userRequirement, filePath) {

let code, gtpCode;
try {
  code = fs.readFileSync(
    filePath,
    "utf8"
  );
} catch (err) {
  console.error(err);
}

const resp = await generateResponse(
  `
      Input: I am passing entire code of generic header section of a landing page. 
      Please update only messaging for JSX code for user requirement: ${userRequirement}
      Return back same code exactly, only change happened should be text, nothing else should be changed.
      I want entire code to be returned back even if there is no change in code.
      I dont want text like rest of the code remains the same, section remains unchanged, ..etc.

      I want full code as it is because I will be importing the returned code in landing page component
  
      code: ${code}
    `,
  false
);

console.log("====resp====", resp);

function extractCode(input) {
  const regex = /```(javascript|jsx)?([\s\S]*?)```/g;
  const match = regex.exec(input);
  return match ? match[2].trim() : null;
}

gtpCode = extractCode(resp);

// Parse the code into an AST
let ast;
try {
  ast = parser.parse(gtpCode, {
    sourceType: "module",
    plugins: ["jsx"],
  });
} catch (error) {
  console.log("it's parse catch");
  console.error("Syntax error:", error.message, error.stack);
  // const resp = await generateResponse(`There is a syntax error in the below javascript code. Please correct the syntax errors only.
  // response should has only the code, nothing else should be there in response
  // error: ${error.message}
  // stacktrace : ${error.stack.split('\n')[0]}
  // code: ${code}
  // `, false)

  // console.log("----res[====", resp)
  // ast = parser.parse(resp, {
  //   sourceType: "module",
  //   plugins: ["jsx"],
  // });
  console.error("Major part of stack trace:", error.stack.split("\n")[0]);
}

let output;
try {
  output = generate(ast).code;
  console.log("==syntax checked==cahtgptcode====", output);

  try {
    fs.writeFileSync(
      filePath,
      output,
      "utf8"
    );
    console.log("File successfully written!");
  } catch (err) {
    console.error(err);
  }
} catch (error) {
  console.log("it's catch");
  console.error("Syntax error:", error.message);
  console.error("Stack trace:", error.stack);
}

}

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
    const getOptions = {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "authorization": "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
      },
      redirect: 'follow'
    };

    while (true) {
      try {
        const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, getOptions);
        const data = await response.json();
        if (data.generations_by_pk.status === "COMPLETE") {
          return data.generations_by_pk.generated_images[0].url;
        }
      } catch (error) {
        console.error('Error:', error);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
    }
  }
// Function to get image details
async function getImageDetails(generationId) {
  const getOptions = {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
    },
    redirect: "follow",
  };

  while (true) {
    try {
      const response = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        getOptions
      );
      const data = await response.json();
      if (data.generations_by_pk.status === "COMPLETE") {
        return data.generations_by_pk.generated_images[0].url;
      }
    } catch (error) {
      console.error("Error:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
  }
}

// Function to download image
async function downloadImage(url, filename) {
    try {
      // Ensure the directory exists
     console.log("==creating=filename====", filename)
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
      console.error('Error:', error);
    }
  }

async function downloadComponentImages(userRequirement, outputImagePath) {

  const gptPrompt = `I want you to act as a prompt generator for Midjourney's artificial intelligence program. Your job is to provide realistic examples that will inspire unique and interesting images from the AI. Describe only one concrete idea, don't mix many. It should not be complex, should be clean, choose all real colors, real textures, real objects. The more detailed and realistic your description, the more interesting the resulting image will be. always use hyper realistic descriptions and features for images, is should never has a scene or description which cannot be realistic. Always
  Use dark themed color pallets. also generate negative prompt: list out most of possible errors AI model cangenerate, for example two faced humans, structures defying gravity, shapes that look like human private parts ..etc

  Response should be maximum of 60 words, prompt and negative prompt. and response must be in json
  example output: {"positive_prompt": "", "negative_prompt": ""}

  Here is your first prompt: "Elegant Background image for landing page of user requirement:  ${userRequirement}"

  Main requirement is response must be in json
`
  const gptRawResponse = await generateResponse(gptPrompt)
  
  const response = JSON.parse(gptRawResponse)
  console.log("===image prompt ====", gptPrompt)
  // Define headers and body for POST request
  const myHeaders = {
    "accept": "application/json",
    "authorization": "Bearer 2dd1df64-644e-47ab-9f6a-724111b49c9f",
    "content-type": "application/json"
  };

  console.log("===image prompt resones====", response)
  const raw = JSON.stringify({
    "prompt": `${response.positive_prompt}. 8K, hyper realistic, Uplight f/1.8 --ar 16:9 --seed 3000 --q 2 --v 5`,
    "negative_prompt": response.negative_prompt,
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
      return data.sdGenerationJob.generationId;
    } catch (error) {
      console.error('Error:', error);
    }
  }


 
  const generationId = await generateImage();
  console.log("===generationId====", generationId)

  const imageUrl = await getImageDetails(generationId);
  console.log("===imageUrl====", imageUrl)
  await downloadImage(imageUrl, outputImagePath);
  }

async function updateTheCodeWithImages(userRequirement, filePath) {
    let code;
    try {
        code = fs.readFileSync(filePath, //"yourproject/src/components/Landingpage/Header.js", 
        'utf8');
    } catch (err) {
        console.error(err);
    }
    
    const imagePaths = extractImagePaths(code);
    console.log("===replacing======", imagePaths);

    const result = {};
    for (let i = 0; i < imagePaths.length; i++) {
        await downloadComponentImages(userRequirement, `yourproject/src/${imagePaths[i].replace("assets/img", "assets/img/aigenerated")}`);
        result[imagePaths[i]] = imagePaths[i].replace("assets/img", "assets/img/aigenerated");
    }
    console.log(result);

    const ast = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});
    
    // Step 2: Traverse the AST and find the nodes to change
    traverse(ast, {
        enter(path) {
            if (
                t.isCallExpression(path.node) &&
                t.isIdentifier(path.node.callee, { name: "require" }) &&
                path.node.arguments.length > 0 &&
                t.isStringLiteral(path.node.arguments[0]) &&
                imagePaths.includes(path.node.arguments[0].value) // check if the current path is in the imagePaths array
            ) {
                // Step 3: Change the value of the node
                if (result[path.node.arguments[0].value]) {
                    path.node.arguments[0].value = result[path.node.arguments[0].value]
                }
            }
        },
    });

    // Step 4: Generate new code
    const { code: newCode } = generator(ast, {}, code);

    // Write the new code to a new file
    fs.writeFileSync(filePath,
      // "yourproject/src/components/Landingpage/Header.js", 
      newCode);
}



module.exports = {
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages
};
