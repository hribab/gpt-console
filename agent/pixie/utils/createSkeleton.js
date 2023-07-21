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
const {
  designSystems,
  skeletonAndConfigURL
} = require("../config/designSystems");


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
  // try {
  //   await exec("rm -rf __MACOSX");
  //   console.log(`__MACOSX directory removed.`);
  // } catch (err) {
  //   console.error(`exec error: ${err}`);
  // }

  await executeCommand();
  console.log("Extraction complete.");
}

async function updateLandingPage(sections) {
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
            if(section == 'headers'){
              path.unshiftContainer(
                "body",
                t.importDeclaration(
                  [
                    t.importDefaultSpecifier(
                      t.identifier('Header')
                    ),
                  ],
                  t.stringLiteral(
                    `components/Landingpage/Headers.js`
                  )
                )
              );  
            }
            else if(section == 'testmonials'){
              path.unshiftContainer(
                "body",
                t.importDeclaration(
                  [
                    t.importDefaultSpecifier(
                      t.identifier("Testimonials")
                    ),
                  ],
                  t.stringLiteral(
                    `components/Landingpage/Testimonials.js`
                  )
                )
              );
            }else{
              path.unshiftContainer(
                "body",
                t.importDeclaration(
                  [
                    t.importDefaultSpecifier(
                      t.identifier(`${section.charAt(0).toUpperCase() + section.slice(1)}`)
                    ),
                  ],
                  t.stringLiteral(
                    `components/Landingpage/${section.charAt(0).toUpperCase() + section.slice(1)}.js`
                  )
                )
              );
            }
          }
        }
      } else if (t.isJSXFragment(path.node)) {
        path.node.children = Object.keys(sections)
          .filter((section) => sections[section])
          .map((section) => {
            let finalSection = section;
            if(section === 'headers') {
              finalSection = 'Header';
            } else if(section === 'testmonials') {
              finalSection = 'Testimonials';
            } else {
              finalSection = section.charAt(0).toUpperCase() + section.slice(1);
            }
            
            return t.jsxElement(
              t.jsxOpeningElement(
                t.jsxIdentifier(finalSection),
                [],
                true
              ),
              null,
              [],
              true
            );
          });
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

async function generateMessaging(userRequirement, filePath, section) {

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
        
  Return me messaging updates to JSX code for section ${section} of landing page.

  rules are: 
  1. The messaging should cover all the text in the JSX code
  2. Top text should be less than the text below it, for example branding text should be less than title text, title text should be less than description text
  3. Branding text should be less than 3 words, Title text should be less than 5 words, Description should be more than 10 words and less than 20 words
  4. Buttons text should be updated as well if any
  5. Look for the word "fill in" in the code, all the lables and strings should be updated with the user requirement in the context of ${section} section
  
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

  traverse(baseAST, {
    enter(path) {
        if (path.isJSXText()) {
            const lineUpdate = updates.find(u => u.originaltext.toLowerCase() === path.node.value.trim().toLowerCase());
            if(lineUpdate) {
                path.node.value = path.node.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
            }
        }

        if (path.isJSXAttribute()) {
            if (path.node.name.name === 'title' || path.node.name.name === 'description') {
                if (path.node.value.type === 'StringLiteral') {
                    const lineUpdate = updates.find(u => u.originaltext.toLowerCase() === path.node.value.value.trim().toLowerCase());
                    if(lineUpdate) {
                        path.node.value.value = path.node.value.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
                    }
                } else if (path.node.value.type === 'JSXExpressionContainer' && path.node.value.expression.type === 'StringLiteral') {
                    const lineUpdate = updates.find(u => u.originaltext.toLowerCase() === path.node.value.expression.value.trim().toLowerCase());
                    if(lineUpdate) {
                        path.node.value.expression.value = path.node.value.expression.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
                    }
                }
            }
        }
    },
  });


  const { code: newCode } = generator(baseAST);


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

async function updateTheCodeWithImages(userRequirement, filePath, selectedDesignSystemName) {
    let code;
    try {
        code = fs.readFileSync(filePath, //"yourproject/src/components/Landingpage/Header.js", 
        'utf8');
    } catch (err) {
        console.error(err);
    }
    
    const imagePaths = extractImagePaths(code);

    const result = {};

    for (let i = 0; i < imagePaths.length; i++) {
        let newPath = selectedDesignSystemName === 'material' ? 
        imagePaths[i].replace("assets/images", "assets/images/aigenerated") : 
        imagePaths[i].replace("assets/img", "assets/img/aigenerated");

        await downloadComponentImages(userRequirement, `yourproject/src/${newPath}`);
        result[imagePaths[i]] = newPath
    }
    console.log("======images replacement pahts===", result);

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


function findDesignInResponse(response, designs) {
  const designNames = Object.keys(designs); // Extract design names
  let designFound = designNames.find(design => response.includes(design));
  
  if (designFound) {
      return designFound;
  } else {
      // If no design is found in the response, return a random one
      let randomDesign = designNames[Math.floor(Math.random() * designNames.length)];
      return randomDesign;
  }
}

async function pickRightDesignSystem(userRequirement) {

  const resp = await generateResponse(
    `Given the User Requirement: ${userRequirement}

    I want you to pick the right design system that suits for the above user requirement
    
    Available desings are:
    ${designSystems}

    Response should be one of the names ${Object.keys(designSystems).join(",")}, no other text should be there.
      `,
    false
  );

  try {
    // Try to parse the input directly.
    enabledSections = JSON.parse(resp);
  } catch(e) {
   
    try {
      // Try to parse the input directly.
      enabledSections = JSON.parse(resp);
    } catch(e) {
     
    }
  }
  
  const selectedDesignSystem = findDesignInResponse(resp, designSystems);

  return {designSystemZipURL: skeletonAndConfigURL[selectedDesignSystem].skeleton, designSystemConfig:skeletonAndConfigURL[selectedDesignSystem].config, selectedDesignSystemName: selectedDesignSystem}
}
async function identifyEnabledSections(userRequirement) {

  const resp = await generateResponse(
    `Given the User Requirement: ${userRequirement}

    I want you to return list of  sections that I can include in landing page for the above user requirement
    
    rules are:
    - If the requirement is not clear, return all only headers sections true
      
    Available sections are:
    headers, features, blogs, teams, projects, pricing, testmonials, contactus

    Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}

    Response should be JSON , no other text should be there.

    Request: Response should be able to parse by a below javascript function:
    
    
    function parseResponse(YourResponse){ return JSON.parse(YourResponse) }

      `,
    false
  );

  let enabledSections
  try {
    // Try to parse the input directly.
    enabledSections = JSON.parse(resp);
  } catch(e) {
    const resp = await generateResponse(
      `Given the User Requirement: ${userRequirement}
  
      I want you to return list of  sections that I can include in landing page for the above user requirement
      
      Available sections are:
      headers, features, blogs, teams, projects, pricing, testmonials, contactus
  
      Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
  
      Response should be JSON , no other text should be there.
  
      Request: Response should be able to parse by a below javascript function:
      
      
      function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
  
        `,
      false
    );  
    try {
      // Try to parse the input directly.
      enabledSections = JSON.parse(resp);
    } catch(e) {
      enabledSections = {
        headers: true,
        features: true,
        blogs: true,
        teams: true,
        projects: false,
        pricing: true,
        testmonials: false,
        contactus: false,
        footer: false,
      }
    }
  }

  return enabledSections

}

function getFirstCodefile(obj) {
  let result = {};
  for (let key in obj) {
      for (let subKey in obj[key]) {
          if (obj[key][subKey].hasOwnProperty('codefile')) {
              result[key] = obj[key][subKey].codefile;
              break;
          }
      }
  }
  return result;
}
function getSampleOutputformat(obj){
  let result = {};
  for (let key in obj) {
      result[key] = `must selecte one of ${Object.keys(obj[key]).join(",")}`;
  }
  return JSON.stringify(result);
}
async function identifySpecificSectionCodeFilesForEnabledSections(userRequirement, enabledSectionsForRequirement, designSystemConfigURL) {
  let designSystemConfig;
  try {
    const response = await fetch(designSystemConfigURL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    designSystemConfig = await response.json();
  } catch (error) {
    console.error('There was an error!', error);
  }


  let enabledSectionConfig = {};

  for (let section in enabledSectionsForRequirement) {
    if (enabledSectionsForRequirement[section]) {
      enabledSectionConfig[section] = designSystemConfig[section];
    }
  }
  let keys = Object.keys(enabledSectionConfig);
  let groupedSectionConfig = [];

  for (let i = 0; i < keys.length; i += 2) {
    let group = {};
    if (keys[i]) group[keys[i]] = enabledSectionConfig[keys[i]];
    if (keys[i + 1]) group[keys[i + 1]] = enabledSectionConfig[keys[i + 1]];
    groupedSectionConfig.push(group);
  }

let finalResult = {};
for (let index = 0; index < groupedSectionConfig.length; index++) {
  const element = groupedSectionConfig[index];
  const prompt =  `Given the User Requirement: ${userRequirement}

  Context: We already identified landing for above requirement has sections ${Object.keys(element).join(",")}
  
  Under each section we multiple sectionname with suitability field.

  I want you to pick the top most sectionname  for the above user requirement and return the sectionname
  
  rules are:
  - If the requirement is not clear, guess probable top sectionname for user requirement and return the sectionname, no other text should be there.
    
  Available sections and sectionname are :
  ${JSON.stringify(element)}

  Sample output: ${getSampleOutputformat(element)}

  Response should be JSON , no other text should be there. never include any explanation or other text in response, strictly only above JSON

  Request: Response should be able to parse by a below javascript function:
  
  function parseResponse(YourResponse){ return JSON.parse(YourResponse) }

    `
  const resp = await generateResponse(
    prompt,
    false
  );

  let  codefileLinks = {};
  try {
    // Try to parse the input directly.
    const selectedSectionNameConfig = JSON.parse(resp);
    for (let key in selectedSectionNameConfig) {
      if(enabledSectionConfig[key] && enabledSectionConfig[key][selectedSectionNameConfig[key]]){
        codefileLinks[key] = enabledSectionConfig[key][selectedSectionNameConfig[key]].codefile;
      }else{
        const values = Object.values(enabledSectionConfig[key]);
        codefileLinks[key] = values[0].codefile;
      }
      
    }

  } catch(e) {
    codefileLinks = getFirstCodefile(element)
    console.log("===errr==r=====", e)

  }
  console.log("===codefileLinks====", codefileLinks);

  finalResult = {...finalResult, ...codefileLinks}
}
return finalResult;

}



module.exports = {
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages,
  pickRightDesignSystem,
  identifyEnabledSections,
  identifySpecificSectionCodeFilesForEnabledSections,
};
