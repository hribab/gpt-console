const fetch = require("node-fetch");
const stream = require("stream");
const fs = require("fs");
const unzipper = require("unzipper");
const { promisify } = require("util");
const path = require("path");
// const fs = require("fs").promises;

const { exec } = require("child_process");
const { generateResponse } = require("../../../utils/api/apiCall");
const {
  extractImagePaths,
  downloadComponentImages,
} = require("./imageProcessing");

const fse = require("fs-extra");

const util = require("util");
const { copySync, removeSync } = require("fs-extra");
const streamPipeline = util.promisify(require("stream").pipeline);
const pipeline = promisify(stream.pipeline);

const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");



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

let code, gtpCode, finalCode;
try {
  code = fs.readFileSync(
    filePath,
    "utf8"
  );
  gtpCode = code;
} catch (err) {
  console.error(err);
}

const resp = await generateResponse(
  `

  Given the User Requirement: “ ${userRequirement} “, 
        
  return me messaging updates to JSX code

  rules are: 
  1. The messaging should cover all the text in the JSX code
  2. Top text should be less than the text below it, for example branding text should be less than title text, title text should be less than description text
  3. Branding text should be less than 3 words, Title text should be less than 5 words, Description should be more than 10 words and less than 20 words
  4. Buttons text should be updated as well if any
  
  Output should be json object with the following format:
  [{"line": The line number on the code that got updated, "originaltext": the original text as it is, dont include any html tags, "updatedtext": update text based on user requirement and SEO friendly},{},{}]
  
  In the response no other text should be there, it must be only JSON. 
  
  Request: Response should be able to parse by javascriptfunction JSON.parse(YourResponse)
  
  Here is the JSX code to modify:

\`\`\`jsx

${code}
    `,
  false
);


let updates;
  try {
    // Try to parse the input directly.
    updates = JSON.parse(resp);
  } catch(e) {
    // If that fails, find the first valid JSON string within the input.
    const regex = /```json?([\s\S]*?)```/g;
    const match = regex.exec(resp);
    updates = match ? JSON.parse(match[1].trim()) : null;
  }

  console.log("===updates===", updates);
  const baseAST = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});

  let currentLineNumber = 1;
  traverse(baseAST, {
      enter(path) {
          if(path.node.loc) {
              currentLineNumber = path.node.loc.start.line;
          }

          if (
              t.isJSXText(path.node)
          ) {
              const lineUpdate = updates.find(u => u.originaltext.toLowerCase() === path.node.value.trim().toLowerCase());
              if(lineUpdate) {
                path.node.value = path.node.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
              }
          }
      },
  });

  const { code: newCode } = generator(baseAST);
  console.log("--newCode----", newCode);


// let ast;
// try {
//   ast = parser.parse(gtpCode, {
//     sourceType: "module",
//     plugins: ["jsx"],
//   });
// } catch (error) {
//   console.log("it's parse catch");
//   console.error("Syntax error:", error.message, error.stack);
//   // const resp = await generateResponse(`There is a syntax error in the below javascript code. Please correct the syntax errors only.
//   // response should has only the code, nothing else should be there in response
//   // error: ${error.message}
//   // stacktrace : ${error.stack.split('\n')[0]}
//   // code: ${code}
//   // `, false)

//   // console.log("----res[====", resp)
//   // ast = parser.parse(resp, {
//   //   sourceType: "module",
//   //   plugins: ["jsx"],
//   // });
//   console.error("Major part of stack trace:", error.stack.split("\n")[0]);
// }

let output;
try {
  output = generate(baseAST).code;
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
