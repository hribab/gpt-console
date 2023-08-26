const fetch = require("node-fetch");
const stream = require("stream");
const fs = require("fs");
const unzipper = require("unzipper");
const { promisify } = require("util");
const path = require("path");
// const fs = require("fs").promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const {spawn } = require("child_process");

const { generateResponse } = require("../../../utils/api/apiCall");
const {
  extractImagePaths,
  downloadComponentImages,
} = require("./imageProcessing");

const fse = require("fs-extra");
const os = require('os');

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

async function killIfAlreadyRunning() {
    const isWindows = os.platform() === 'win32';
    if (isWindows) {
        // Windows command
        try {
            const { stdout: output } = await exec('netstat -ano | findstr :3000');
            const processId = output.trim().split(/\s+/).pop();
            await exec(`taskkill /PID ${processId} /F`);
        } catch (err) {
            console.error(`exec error: ${err}`);
        }
    } else {
        // Mac / Linux command
        try {
          const { stdout: output } = await exec('lsof -i tcp:3000');
          const lines = output.split('\n');
          for (let line of lines) {
              const p = line.trim().split(/\s+/);
              const processId = p[1];
              if (processId !== undefined && !isNaN(processId)) {
                  try {
                      // Check if the process is running
                      await exec('kill -0 ' + processId);
                      // If the above command didn't throw an error, the process is running and we can kill it
                      await exec('kill -9 ' + processId);
                  } catch (err) {
                    return;
                      // If the 'kill -0' command failed, the process is not running
                      // console.error(`Process ${processId} is not running`);
                  }
              }
          }
        } catch (err) {
          return;
          //console.error(`exec error: ${err}`);
        }

    }
}


// async function runStartCommand(command, directory) {
//   return new Promise((resolve, reject) => {
//     exec(command, { cwd: directory }, (error, stdout, stderr) => {
//       if (error) {
//         console.log("======err--------", error)
//         // console.warn(error);
//         reject(error);
//         if(error.includes("Something is already running on port 3000")){
//           killIfAlreadyRunning()
//         }
//       } else {
//         console.log("======err--------", stdout)

//         if(stdout.includes("Something is already running on port 3000")){
//           killIfAlreadyRunning()
//         }
//         // Let's suppose that the stdout contains the URL at which the app is running
//         // Example: "Starting the development server...\nhttp://localhost:3000"
//         const matches = stdout.match(/(http:\/\/localhost:\d+)/);
//         if (matches) {
//           resolve(matches[0]);
//         } else {
//           resolve(stdout ? stdout : stderr);
//         }
//       }
//     });
//   });
// }

async function runStartCommand(command, directory) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const proc = spawn(cmd, args, { cwd: directory });

    proc.stderr.on('data', async (data) => {
    //  console.log(`stderr: ${data}`);
    });

    proc.on('error', (error) => {
      // console.log(`errorerrorerrorerror: ${error}`);
      // console.error(`exec error: ${error}`);
      reject(error);
    });

    return proc.stdout.on('data', async (data) => {
      proc.stdout.on('data', async (data) => {
        if (data.includes("Something is already running on port 3000")) {
          await killIfAlreadyRunning();
          const [reCmd, ...reArgs] = command.split(' ');
          const reProc = spawn(reCmd, reArgs, { cwd: directory });
          reProc.stdout.on('data', (data) => {
            if(data.toString().includes("localhost")){
              return resolve("http://localhost:3000");
            }
          });
        } else if (data.toString().includes("localhost")) {
          return resolve("http://localhost:3000");
        }
      });

       // Add a timeout to reject the promise if no matching data is found
      setTimeout(() => {
        resolve("http://localhost:3000")
      }, 10000); 
      // const matches = data.toString().match(/(http:\/\/localhost:\d+)/);
      // console.log("===matches====", matches)
      // if (matches) {
      //   resolve(matches[0]);
      // }
    });
  });
}


async function isYarnInstalled() {
  return new Promise((resolve, reject) => {
    exec('yarn --version', (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function runTheApp() {
  try {
    const yarnInstalled = await isYarnInstalled();
    const installCommand = yarnInstalled ? 'yarn start' : 'npm start';
    const result = await runStartCommand(installCommand, './yourproject');    
    return `App is running at ${result}`
    // // console.log(result);
  } catch (error) {
    // console.log("============error==========", error)
    return `Got it! It seems there's a hiccup. Just head over to 'yourproject' folder and kick things off with 'yarn start' or 'npm start'. Let's get rolling!`
    // console.error(error);
  }
}

async function executeCommand() {
  try {
    const yarnInstalled = await isYarnInstalled();
    const installCommand = yarnInstalled ? 'yarn install' : 'npm install';
    const result = await runCommand(installCommand, './yourproject');
    // // console.log(result);
  } catch (error) {
    // console.error(error);
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
  //   // console.log(`__MACOSX directory removed.`);
  // } catch (err) {
  //   console.error(`exec error: ${err}`);
  // }

  await executeCommand();
  // // console.log("Extraction complete.");
}

async function updateLandingPage(sections) {
  let code;
  try {
    code = fs.readFileSync(
      "yourproject/src/views/LandingPage.js",
      "utf8"
    );
  } catch (err) {
    // console.error(err);
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
    // // console.log("File successfully written!");
  } catch (err) {
    // console.error(err);
  }
}

async function downloadCodeFile(url, destinationPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }
  await fse.ensureDir(path.dirname(destinationPath));

  await streamPipeline(response.body, fs.createWriteStream(destinationPath));
  // // console.log(`File downloaded to ${destinationPath}`);
}

async function generateMessaging(userRequirement, filePath, section, formMattedContextFromWebURL=null) {
  // console.log("---generateMessaging ====", section,formMattedContextFromWebURL );

    let code, gtpCode, finalCode;
    try {
      code = fs.readFileSync(
        filePath,
        "utf8"
      );
      gtpCode = code;
    } catch (err) {
      return;
      // console.error(err);
    }

    const resp = await generateResponse(
      `
      Given the User Requirement: “ ${userRequirement} “, ${formMattedContextFromWebURL}

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
      
      Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
      
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
        if(match && match[1]){
          try{
            updates = JSON.parse(match[1].trim())
          }catch(e) {
            const resp = await generateResponse(
              `
              Given the User Requirement: “ ${userRequirement} “, ${formMattedContextFromWebURL}

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
              
              Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
              
              Here is the JSX code to modify:
              
              \`\`\`jsx
            
            ${code}
                `,
              false
            );
            updates = JSON.parse(resp);  
          }
        }
      }
      if(!updates){
        const resp = await generateResponse(
          `
          Given the User Requirement: “ ${userRequirement} “, ${formMattedContextFromWebURL}

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
          
          Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
          
          Here is the JSX code to modify:
          
          \`\`\`jsx

        ${code}
            `,
          false
        );
      
        try {
          // Try to parse the input directly.
          updates = JSON.parse(resp);
        } catch(e) {
          return;
        }

      }
      if(!updates){
        return;
      }
      // // console.log("===updates===", updates);
      const baseAST = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});

      traverse(baseAST, {
        enter(path) {
          if (path.isJSXText()) {
            const lineUpdate = updates.find(u => u?.originaltext?.toLowerCase() === path.node.value.trim().toLowerCase());
            if(lineUpdate) {
              path.node.value = path.node.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
            }
          }
      
          if (path.isJSXAttribute()) {
            if (path.node.name.name === 'title' || path.node.name.name === 'description' || path.node.name.name === 'review' ||  path.node.name.name === 'label' ||  path.node.name.name === 'position') {
              if (path.node.value.type === 'StringLiteral') {
                const lineUpdate = updates.find(u => u?.originaltext?.toLowerCase() === path.node.value.value.trim().toLowerCase());
                if(lineUpdate) {
                  path.node.value.value = path.node.value.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
                }
              } else if (path.node.value.type === 'JSXExpressionContainer' && path.node.value.expression.type === 'StringLiteral') {
                const lineUpdate = updates.find(u => u?.originaltext?.toLowerCase() === path.node.value.expression.value.trim().toLowerCase());
                if(lineUpdate) {
                  path.node.value.expression.value = path.node.value.expression.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
                }
              }
            }
          }
        },
      });
      

      // const { code: newCode } = generator(baseAST);
    // let ast;
    // try {
    //   ast = parser.parse(gtpCode, {
    //     sourceType: "module",
    //     plugins: ["jsx"],
    //   });
    // } catch (error) {
    //   // console.log("it's parse catch");
    //   console.error("Syntax error:", error.message, error.stack);
    //   // const resp = await generateResponse(`There is a syntax error in the below javascript code. Please correct the syntax errors only.
    //   // response should has only the code, nothing else should be there in response
    //   // error: ${error.message}
    //   // stacktrace : ${error.stack.split('\n')[0]}
    //   // code: ${code}
    //   // `, false)

    //   // // console.log("----res[====", resp)
    //   // ast = parser.parse(resp, {
    //   //   sourceType: "module",
    //   //   plugins: ["jsx"],
    //   // });
    //   console.error("Major part of stack trace:", error.stack.split("\n")[0]);
    // }

    let output;
    
    try {
      output = generate(baseAST).code;
      // console.log("=====output===", output)
      let subStringArray = ["Scrollingfeature1", "Scrollingfeature2", "Scrollingfeature3"];
      let lines;
      if(section.toLowerCase().includes("header")){
        let allSubstringsPresent = subStringArray.every(subString => output.includes(subString));
        if(allSubstringsPresent){
          const resp = await generateResponse(
            `
            Given the user requirement: "${userRequirement}", and web context from "${formMattedContextFromWebURL}", we're focusing on the "${section}" section of the landing page.
            With these considerations in mind, we need you to generate three succinct and compelling header lines, with a maximum of three words each, for a dynamic scrolling text display.
            These lines, serving as the primary points of attraction, should effectively encourage the user to take action by clicking the button
            
            example output: 
            {
              headers:  ["line1", "line2", "line3"]
            }
            response should be json
            
            Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }

              `,
            false
          );
          try {
            // Try to parse the input directly.
            lines = JSON.parse(resp);
          } catch(e) {
            const resp = await generateResponse(
              `
              Given the user requirement: "${userRequirement}", and web context from "${formMattedContextFromWebURL}", we're focusing on the "${section}" section of the landing page.
              With these considerations in mind, we need you to generate three succinct and compelling header lines, with a maximum of three words each, for a dynamic scrolling text display.
              These lines, serving as the primary points of attraction, should effectively encourage the user to take action by clicking the button
              
              example output:
              {
                headers:  ["line1", "line2", "line3"]
              }
              
             
              response should be json
              Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
  
                `,
              false
            );
            try {
              // Try to parse the input directly.
              lines = JSON.parse(resp);
            } catch(e) {
              lines = null;
            }
          }
  
        
        }
        if(!lines){
          const resp = await generateResponse(
            `
            Given the user requirement: "${userRequirement}", and web context from "${formMattedContextFromWebURL}", we're focusing on the "${section}" section of the landing page.
            With these considerations in mind, we need you to generate three succinct and compelling header lines, with a maximum of three words each, for a dynamic scrolling text display.
            These lines, serving as the primary points of attraction, should effectively encourage the user to take action by clicking the button
            example output: ["line1", "line2", "line3"]
            response should be json
            Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
              `,
            false
          );
          try {
            // Try to parse the input directly.
            lines = JSON.parse(resp);
          } catch(e) {
            lines = ["Scrollingfeature1", "Scrollingfeature1", "Scrollingfeature1"]
          }
        }

        // console.log("---lines ====", lines );

        if(lines && lines.headers && lines.headers.length > 0){
          for (let i = 0; i < subStringArray.length; i++) {
            output = output.split(subStringArray[i]).join(lines.headers[i]);
          }
        }
      }
      try {
        fs.writeFileSync(
          filePath,
          output,
          "utf8"
        );
      } catch (err) {
        // console.error(err);
      }
    } catch (error) {
      // console.error("Syntax error:", error.message);
      // console.error("Stack trace:", error.stack);
      return;
    }

}

async function updateTheCodeWithImages(userRequirement, filePath, selectedDesignSystemName, formMattedContextFromWebURL=null) {
    // console.log("------------------", filePath, selectedDesignSystemName)  
  let code;
    try {
        code = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        // console.log("==code=error==" )
        return;
        // console.error(err);
    }
    
    const imagePaths = extractImagePaths(code);
    // console.log("=========imagePaths=============", imagePaths, selectedDesignSystemName === 'material')
    const result = {};

    for (let i = 0; i < imagePaths.length; i++) {
        let newPath = selectedDesignSystemName === 'material' ? 
        imagePaths[i].replace("assets/images", "assets/images/aigenerated") : 
        imagePaths[i].replace("assets/img", "assets/img/aigenerated");
        // console.log("========downloadComponentImages==========started==")

        const isSuccess = await downloadComponentImages(userRequirement, `yourproject/src/${newPath}`, formMattedContextFromWebURL);
        // console.log("========downloadComponentImages==========done==")
        if(isSuccess){
          result[imagePaths[i]] = newPath
        }
    }
    // // console.log("======images replacement pahts===", result);

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


function findDesignInResponse(designs) {
  const designNames = Object.keys(designs); // Extract design names  
  return designNames[Math.floor(Math.random() * designNames.length)];
}

async function pickRightDesignSystem(userRequirement, contentFromFirstURL) {

  const resp = await generateResponse(
    `Given the User Requirement: ${userRequirement}
    ${contentFromFirstURL ? `Web context: ${JSON.stringify(contentFromFirstURL)}` : ""}

    I want you to pick the right design system that suits for the above user requirement
    
    Available desings are:
    ${JSON.stringify(designSystems)}

    Response should be one of the names ${Object.keys(designSystems).join(",")}, no other text should be there. No explanation is required.
    `,
    false
  );
  // console.log("====resp=====", resp)
  let selectedDesignSystem;
  if(resp){
    const available = Object.keys(designSystems); 
    let selected = 'material'; // default to 'material'//make it random out of 4
  
    for(let i = 0; i < available.length; i++) {
        if (resp.includes(available[i])) {
            selected = available[i];
            break;
        }
    }
    selectedDesignSystem = selected
  }else{
    selectedDesignSystem = findDesignInResponse(designSystems);
  }
  // console.log("====resp=====", selectedDesignSystem)

  return {designSystemZipURL: skeletonAndConfigURL[selectedDesignSystem].skeleton, designSystemConfig:skeletonAndConfigURL[selectedDesignSystem].config, selectedDesignSystemName: selectedDesignSystem}
}

async function pickRightDesignSystemForUpdate(userRequirement, existingDesignSystem, existingPrompt) {
    // create a copy of the original object
  let newDesignSystems = {...designSystems};

  // delete the 'blk' property from the new object
  delete newDesignSystems[existingDesignSystem];

  const resp = await generateResponse(
    `Given the user update requirement: ${userRequirement}
     for existing Prompt: ${existingPrompt}

    I want you to pick the right design system that suits for the above  update requirement
    
    Available desings are:
    ${JSON.stringify(newDesignSystems)}

    Response should be one of the names ${Object.keys(newDesignSystems).join(",")}, no other text should be there. No explanation is required.
      `,
    false
  );

  let selectedDesignSystem;
  if(resp){
    const available = Object.keys(newDesignSystems); 
    let selected = 'material'; // default to 'material'
  
    for(let i = 0; i < available.length; i++) {
        if (resp.includes(available[i])) {
            selected = available[i];
            break;
        }
    }
    selectedDesignSystem = selected
  }else{
    selectedDesignSystem = findDesignInResponse(newDesignSystems);
  }
  return {designSystemZipURL: skeletonAndConfigURL[selectedDesignSystem].skeleton, designSystemConfig:skeletonAndConfigURL[selectedDesignSystem].config, selectedDesignSystemName: selectedDesignSystem}
}


async function identifyEnabledSections(userRequirement) {

  const resp = await generateResponse(
    `Given the User Requirement: ${userRequirement}

    I want you to return list of  sections that I can include in landing page for the above user requirement
    
    Rules are:
    - If the requirement is not clear, return only headers section as true
      
    Available sections are:
    headers, features, blogs, teams, projects, pricing, testmonials, contactus

    Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}

    Response Must be only JSON , no other text should be there.
    Never skip and return string like // Additional or // Similar entries for others, return full
    Never return output format as  this example: some explationation \`\`\` output, i want pure json 
   
    Request: Response should be able to parse by a below javascript function:
    
    function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }

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
  
      Response Must be only JSON , no other text should be there.
      Never skip and return string like // Additional or // Similar entries for others, return full
      Never return output format as  this example: some explationation \`\`\` output, i want pure json 
     
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
    // console.error('There was an error!', error);
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
    const prompt =  `Given User Needs: ${userRequirement}

    In the context of: Our analysis has determined the landing page for the above requirements includes these sections: ${Object.keys(element).join(",")}
    
    Please review the following sections, their names, and suitability fields:
    
    I would like you to select the most suitable section name for the given user requirements.
    
    Guidelines are:
    
    If the requirement isn't explicit, make an educated guess to choose the most probable section name.
    
    The available sections and their names are:
    ${JSON.stringify(element)}
    
    A sample output format can be seen here: ${getSampleOutputformat(element)}
    
    Please ensure your response is in JSON format only. Do not include any explanations or extraneous text in the response. Stick strictly to the JSON format.
    
    It's imperative that your response can be parsed by the following JavaScript function:
    
    function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
      `
    const resp = await generateResponse(
      prompt,
      false
    );

    let  codefileLinks = {};
    let selectedSectionNameConfig;
    try {
      // Try to parse the input directly.
      selectedSectionNameConfig = JSON.parse(resp);
    } catch(e) {
      const prompt =  `Given User Needs: ${userRequirement}

      In the context of: Our analysis has determined the landing page for the above requirements includes these sections: ${Object.keys(element).join(",")}
      
      Please review the following sections, their names, and suitability fields:
      
      I would like you to select the most suitable section name for the given user requirements.
      
      Guidelines are:
      
      If the requirement isn't explicit, make an educated guess to choose the most probable section name.
      
      The available sections and their names are:
      ${JSON.stringify(element)}
      
      A sample output format can be seen here: ${getSampleOutputformat(element)}
      
      Please ensure your response is in JSON format only. Do not include any explanations or extraneous text in the response. Stick strictly to the JSON format.
      
      It's imperative that your response can be parsed by the following JavaScript function:
      
      function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
        `
      const resp = await generateResponse(
        prompt,
        false
      );
      try {
        // Try to parse the input directly.
        selectedSectionNameConfig = JSON.parse(resp);
      } catch(e) {
        selectedSectionNameConfig = null
      }
    }
    if(!selectedSectionNameConfig){
      const prompt =  `Given User Needs: ${userRequirement}

      In the context of: Our analysis has determined the landing page for the above requirements includes these sections: ${Object.keys(element).join(",")}
      
      Please review the following sections, their names, and suitability fields:
      
      I would like you to select the most suitable section name for the given user requirements.
      
      Guidelines are:
      
      If the requirement isn't explicit, make an educated guess to choose the most probable section name.
      
      The available sections and their names are:
      ${JSON.stringify(element)}
      
      A sample output format can be seen here: ${getSampleOutputformat(element)}
      
      Please ensure your response is in JSON format only. Do not include any explanations or extraneous text in the response. Stick strictly to the JSON format.
      
      It's imperative that your response can be parsed by the following JavaScript function:
      
      function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
        `
      const resp = await generateResponse(
        prompt,
        false
      );
      try {
        // Try to parse the input directly.
        selectedSectionNameConfig = JSON.parse(resp);
      } catch(e) {
        selectedSectionNameConfig = null
      }
    }

    if(selectedSectionNameConfig){
      for (let key in selectedSectionNameConfig) {
        if(enabledSectionConfig[key] && enabledSectionConfig[key][selectedSectionNameConfig[key]]){
          codefileLinks[key] = enabledSectionConfig[key][selectedSectionNameConfig[key]].codefile;
        }else{
          const values = Object.values(enabledSectionConfig[key]);
          codefileLinks[key] = values[0].codefile;
        }
      } 
    }else{
      codefileLinks = getFirstCodefile(element)
    }

    finalResult = {...finalResult, ...codefileLinks}
  }
  return finalResult;
}


function formatContextFromURL(section, rawTextFromURL){
  let referenceTextFromURL;

  switch (section) {
    case "headers":
      if(rawTextFromURL['header']){
       referenceTextFromURL = `${rawTextFromURL['header'].title}, ${rawTextFromURL['header'].description}`
      }
      break;
    case "features":
      if(rawTextFromURL[section]){
        if (Array.isArray(rawTextFromURL[section]) && rawTextFromURL[section].length) {
          referenceTextFromURL = rawTextFromURL[section].map(item => item.name);
        }
      }
      break;
    case "blogs":
      if(rawTextFromURL[section]){
        if (Array.isArray(rawTextFromURL[section]) && rawTextFromURL[section].length) {
          referenceTextFromURL = rawTextFromURL[section].map(item => item.title);
        }
      }
      break;
    case "teams":
      if(rawTextFromURL[section]){
        if (Array.isArray(rawTextFromURL[section]) && rawTextFromURL[section].length) {
          referenceTextFromURL = rawTextFromURL[section].map(item => item.name);
        }
      }
      break;
    case "projects":
      if(rawTextFromURL[section]){
        if (Array.isArray(rawTextFromURL[section]) && rawTextFromURL[section].length) {
          referenceTextFromURL = rawTextFromURL[section].map(item => item.title);
        }
      }
      break;
    case "pricing":
      if(rawTextFromURL[section]){
        if (Array.isArray(rawTextFromURL[section]) && rawTextFromURL[section].length) {
          referenceTextFromURL = rawTextFromURL[section].map(item => item.name)
        }
      }
      break;
    case "testimonials":
      if(rawTextFromURL[section]){
        if (Array.isArray(rawTextFromURL[section]) && rawTextFromURL[section].length) {
          referenceTextFromURL = rawTextFromURL[section]
        }
      }
      break;
    default:
      break;
  }

  if(referenceTextFromURL){
    if(section == "headers"){
      return `Website Inspiration: ${referenceTextFromURL}
      Leverage this material and the user's specific needs to craft an irresistible call-to-action.
      Remember, our goal is to captivate the audience and entice them to click that button!
      `
    }
    return `Reference string from website: ${referenceTextFromURL}`
  }
  return null;
}

async function isRequirementForOnlyDocumentation(userRequirement) {
 // console.log("userRequirement", userRequirement)
  let isOnlyDocumentation = false;
  const prompt =  `Given User Needs: ${userRequirement}  
  Please determine if user wants to create documentation page
  
  Response Must be only true or false. No other text should be there in response. No explanation is required. 
  `
  const resp = await generateResponse(
    prompt,
    false
  );

  //console.log("========resp", resp)
  if(resp){
    if(resp.toLowerCase().includes("true")){ isOnlyDocumentation = true }
  }
  // console.log("isOnlyDocumentation", isOnlyDocumentation)
  return isOnlyDocumentation;
}



module.exports = {
  runTheApp,
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages,
  pickRightDesignSystem,
  pickRightDesignSystemForUpdate,
  identifyEnabledSections,
  identifySpecificSectionCodeFilesForEnabledSections,
  formatContextFromURL,
  isRequirementForOnlyDocumentation
};
