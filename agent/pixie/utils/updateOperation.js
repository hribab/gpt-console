const fetch = require("node-fetch");
const stream = require("stream");
const fs = require("fs");
const unzipper = require("unzipper");
const { promisify } = require("util");
const path = require("path");
// const fs = require("fs").promises;

const { exec } = require("child_process");
const { generateResponse } = require("../../../utils/api/apiCall");
// TODO: move all prompts to prompts.js
// const {  PROMPT_GENERATOR,
//   SECTIONS_GENERATOR} = require("../../../config/prompts");

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
    extractImagePaths,
    downloadComponentImages,
  } = require("./imageProcessing");

const {
themeNames,
skeletonAndConfigURL
} = require("../config/designSystems");

const {
pickRightDesignSystemForUpdate,
identifyEnabledSections,
identifySpecificSectionCodeFilesForEnabledSections,
downloadAndUnzip,
updateLandingPage,
downloadCodeFile,
generateMessaging,
updateTheCodeWithImages,
} = require("./createSkeleton");

const {
createPixieConfigFile,
updatePixieConfigStatus,
renameProjectFolderIfExist
} = require("../config/pixieConfigOperations");
  

async function checkForDesignChange(userRequirement, filePath) {
    //TODO: we need to save original user request to create the page const createRequirement = `landing page for selling oversized t-shirts`;
    const resp = await generateResponse(
        `
        Context: I recently created a landing page for a client. Now, the client wants to make some modifications to this page.

        Client's Request for Modification: "${userRequirement}"

        Based on the client's request, i want to know if user wants to change entire website completely. If user intention is to change entire website completely, then return true, else return false.
        
        note: any kind of user disatisfaction with the existing landing page should be considered as intention is to change entire website completely, hence return true.

        just return true or false, no explanation is needed.
          `,
        false
      );
    return resp.toLocaleLowerCase().includes("true") ? true : false;
}
async function implementDesignChange(userRequirement, alreadySelectedDesignSystemName, existingPrompt, callback) {    
        try {
          renameProjectFolderIfExist()
          const {designSystemZipURL, designSystemConfig, selectedDesignSystemName} = await pickRightDesignSystemForUpdate(userRequirement, alreadySelectedDesignSystemName, existingPrompt);
        
          await downloadAndUnzip(designSystemZipURL);
          createPixieConfigFile({
            prompt: userRequirement,
            mode: 'madmax',
            design: themeNames[selectedDesignSystemName],
            pixieversion: 1,
            time: new Date().toISOString(),
            status: 'progress'
          })
          const enabledSectionsForRequirement = await identifyEnabledSections(`Initial prompt: ${existingPrompt}, Update request: ${userRequirement}`);
      
          const codeFilesForEnabledSections = await identifySpecificSectionCodeFilesForEnabledSections(`Initial prompt: ${existingPrompt}, Update request: ${userRequirement}`, enabledSectionsForRequirement, designSystemConfig);
      
          await updateLandingPage(enabledSectionsForRequirement);
      
          // // TODO: based on sections, download the code files
      
          for (let section in enabledSectionsForRequirement) {
            if (enabledSectionsForRequirement[section]) { // If the section is true
              const link = codeFilesForEnabledSections[section];
              let fileName = `${section.charAt(0).toUpperCase()}${section.slice(1)}`
              if (section === "testmonials") {
                fileName = "Testimonials";
              }
              const path = `yourproject/src/components/Landingpage/${fileName}.js`;
              await downloadCodeFile(link, path);
              await generateMessaging(
                `Initial prompt: ${existingPrompt}, Update request: ${userRequirement}`,
                path,
                section
              );
              await updateTheCodeWithImages(
                `Initial prompt: ${existingPrompt}, Update request: ${userRequirement}`,
                path,
                selectedDesignSystemName
              );
            }
          }
          updatePixieConfigStatus('completed');
          
        } catch (error) {
          return callback(null, `Error Occured, Please try again: ${error}`);
        }
}
async function identifyUpdateSections(userRequirement, originalPrompt) {

    const resp = await generateResponse(
        `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
        Now, the client wants to make some modifications to this page.

        Client's Request for Modification: "${userRequirement}"
    
        I want you to determine probable sections that user wants to make changes based on Request for Modification
        based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
        
        rules are:
        - If the requirement is not clear, return empty object {}
        - If the intention is to not change anything, return empty object {}
          
        Available sections are:
        headers, features, blogs, teams, projects, pricing, testmonials, contactus
    
        Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
    
        Response should be JSON , no other text should be there.
    
        Request: Response should be able to parse by a below javascript function:
        
        
        function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
    
          `,
        false
      );
    
      // // console.log("=====resp=====", resp);
      let enabledSections
      try {
        // Try to parse the input directly.
        enabledSections = JSON.parse(resp);
      } catch(e) {
        // // console.log("====catch====", e)
        const resp = await generateResponse(
          `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
          Now, the client wants to make some modifications to this page.
  
          Client's Request for Modification: "${userRequirement}"
      
          I want you to return list of  sections that user wants to make changes based on user requirement
          
          rules are:
          - If the requirement is not clear, return empty object {}
          - If the intention is to not change anything, return empty object {}
            
          Available sections are:
          headers, features, blogs, teams, projects, pricing, testmonials, contactus
      
          Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
      
          Response should be JSON , no other text should be there.
      
          Request: Response should be able to parse by a below javascript function:
          
          
          function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
      
            `,
          false
        );
        // // console.log("=====resp2=====", resp);
        try {
          // Try to parse the input directly.
          enabledSections = JSON.parse(resp);
        } catch(e) {
          enabledSections = {
            headers: false,
            features: false,
            blogs: false,
            teams: false,
            projects: false,
            pricing: false,
            testmonials: false,
            contactus: false,
            footer: false,
          }
        }
      }
    
      return enabledSections

}
async function determineSectionsDesignChange(userRequirement, originalPrompt) {
    const resp = await generateResponse(
        `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}

        Client's Request for Modification: "${userRequirement}"
    
        I want you to determine if user wants to change the design of any section headers, features, blogs, teams, projects, pricing, testmonials, contactus
        If user wants to make design changes to any section, determine what sections user wants to change the design
        
        Return list of  sections that user wants to change the design based on user requirement
        
        rules are:
        - If the requirement is not clear, return empty object {}
        - If the intention is to not change anything, return empty object {}
          
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
          `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
          Now, the client wants to make some modifications to this page.
  
          Client's Request for Modification: "${userRequirement}"
      
          I want you to determine if user intension to change the design of any section headers, features, blogs, teams, projects, pricing, testmonials, contactus
          If user wants to make design changes to any section, determine what sections user wants to change the design
          
          Return list of  sections that user wants to change the design based on user requirement

          rules are:
          - If the requirement is not clear, return empty object {}
          - If the intention is to not change anything, return empty object {}
            
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
                headers: false,
                features: false,
                blogs: false,
                teams: false,
                projects: false,
                pricing: false,
                testmonials: false,
                contactus: false,
                footer: false,
              }
        }
      }
    
      return  enabledSections;
}

async function updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation(sectionsDesignChange, userRequirement, selectedInternalDesignSystem, originalRequirement) {
    
    const designSystemConfigURL = skeletonAndConfigURL[selectedInternalDesignSystem].config
    
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
    for (let section in sectionsDesignChange) {

        if (sectionsDesignChange[section]) { // If the section is true
          if(designSystemConfig[section]){
            const allSubSections = Object.keys(designSystemConfig[section]); // Extract design names  

            const subSection = allSubSections[Math.floor(Math.random() * allSubSections.length)];
            const link = designSystemConfig[section][subSection].codefile
            let fileName = `${section.charAt(0).toUpperCase()}${section.slice(1)}`
            if (section === "testmonials") {
                fileName = "Testimonials";
            }
            const path = `yourproject/src/components/Landingpage/${fileName}.js`;
            await downloadCodeFile(link, path);
            // await generateMessaging(
            //     `Initial prompt: ${originalRequirement}, User update request: ${userRequirement}`,
            //     path,
            //     section
            // );
            // await updateTheCodeWithImages(
            //     `Initial prompt: ${originalRequirement}, User update request: ${userRequirement}`,
            //     path,
            //     selectedDesignSystemName
            // );
          }
        }
    }
}

async function determineUpdateType(userRequirement, originalPrompt) {
    const resp = await generateResponse(
        `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}

        Client's Request for Modification: "${userRequirement}"
    
        I want you to return type of update user wants to make based on user requirement
        
        rules are:
        - If the requirement is not clear, return empty object {}
        - If the intention is to not change anything, return empty object {}
          
        Available update types are:
        messaging, backgroundimage, remove
    
        Sample output: {"messaging": true, "backgroundimage": true, "remove": false}
    
        Response should be JSON, no other text should be there.
    
        Request: Response should be able to parse by a below javascript function:
        
        
        function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
    
          `,
        false
      );
    
      let updateOperations
      try {
        // Try to parse the input directly.
        updateOperations = JSON.parse(resp);
      } catch(e) {
        const resp = await generateResponse(
          `Context: I recently created a landing page for a client. Now, the client wants to make some modifications to this page.

          Client's Request for Modification: "${userRequirement}"
      
          I want you to return type of update user wants to make based on user requirement
          
          rules are:
          - If the requirement is not clear, return empty object {}
          - If the intention is to not change anything, return empty object {}
            
          Available update types are:
          messaging: If user requirement is to update the messaging or text of any kind 
          backgroundimage: If user requirement is to update the image of any kind
          remove: If user requirement is to remove any thing
      
          Sample output: {"messaging": true, "backgroundimage": true, "remove": false}
      
          Response should be JSON , no other text should be there.
      
          Request: Response should be able to parse by a below javascript function:
    
          function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
      
            `,
          false
        );  
        try {
          // Try to parse the input directly.
          updateOperations = JSON.parse(resp);
        } catch(e) {
            updateOperations = {
            messaging: false,
            backgroundimage: false,
            remove: false,
          }
        }
      }
    
      return updateOperations
}
async function executeMessagingUpdate(userRequirement, filePath) {

    let code;
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
    // // console.log("=====first resp=====", resp);
    let updates;
    try {
    // Try to parse the input directly.
        updates = JSON.parse(resp);
    } catch(e) {
    // If that fails, find the first valid JSON string within the input.
    const regex = /```json?([\s\S]*?)```/g;
    const match = regex.exec(resp);
    if(match) {
        try{
            updates = JSON.parse(match[1].trim())
        } catch(e) {
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
            try {
            // Try to parse the input directly.
                updates = JSON.parse(resp);
            } catch(e) {
            // If that fails, find the first valid JSON string within the input.
            const regex = /```json?([\s\S]*?)```/g;
            const match = regex.exec(resp);
            updates = match ? JSON.parse(match[1].trim()) : null;
            }

        }
    }else{
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
            try {
            // Try to parse the input directly.
                updates = JSON.parse(resp);
            } catch(e) {
            // If that fails, find the first valid JSON string within the input.
            const regex = /```json?([\s\S]*?)```/g;
            const match = regex.exec(resp);
            updates = match ? JSON.parse(match[1].trim()) : null;
            }
    }
    }

    // // console.log("===updates===", updates);
    const baseAST = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});

    traverse(baseAST, {
        enter(path) {

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
    // // console.log("--newCode----", newCode);

    let output;
    try {
        output = generate(baseAST).code;
        try {
        fs.writeFileSync(
            filePath,
            output,
            "utf8"
        );
        // // console.log("File successfully written!");
        } catch (err) {
        console.error(err);
        }
    } catch (error) {
        // // console.log("it's catch");
        console.error("Syntax error:", error.message);
        console.error("Stack trace:", error.stack);
    }

}
async function executeBackgroundImageUpdate(userRequirement, filePath) {
        let code;
        try {
            code = fs.readFileSync(filePath,'utf8');
        } catch (err) {
            console.error(err);
        }
        
        const imagePaths = extractImagePaths(code);
        // // console.log("===replacing======", imagePaths);
    
        const result = {};
        for (let i = 0; i < imagePaths.length; i++) {
            await downloadComponentImages(userRequirement, `yourproject/src/${imagePaths[i].replace("assets/img", "assets/img/aigenerated")}`);
            result[imagePaths[i]] = imagePaths[i].replace("assets/img", "assets/img/aigenerated");
        }
        // // console.log(result);
    
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
async function removeOperation(userRequirement, filePath) {
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
            
            return me remove updates to JSX code
        
            Rules are: 
            1. List out all the code that user wants to remove from given JSX code and return underlying text value of the html node, should be case insensitive
            2. Updates should cover all the divs of react component, example names,  headers, descriptions, buttons..etc
            3. Must escape double quotes with backslash, example: "hello \"world\"", so that I can parse using JSON.parse()
            
            Output should be json object with the following format:
            [{"line": The line number on the code that need to be removed, "toberemovedtext": the text value of the html node that need to be removed },{},{}]
            
            If there is nothing to remove, return empty array

            In the response no other text should be there, it must be only JSON. 
            
            Request: Response should be able to parse by javascript function JSON.parse(YourResponse), 
            
            Here is the JSX code to modify:
        
        \`\`\`jsx
        
        ${code}
            `,
            false
        );
        
        // // console.log("=====resp=====", resp);
        let updates;
        try {
        // Try to parse the input directly.
        updates = JSON.parse(resp);
        } catch(e) {
            let start = resp.indexOf('[');
            let end = resp.lastIndexOf(']') + 1;
            let jsonStr = resp.slice(start, end);
            
            // Replace single quotes around HTML with double quotes
            // and escape inner double quotes
            jsonStr = jsonStr.replace(/'<(.+?)>'/g, function(match, p1) {
                return '"<' + p1.replace(/"/g, '\\"') + '>"';
            });
            try {
                // Try to parse the input directly.
                updates = JSON.parse(jsonStr);

                } catch(e) {

                    const resp = await generateResponse(
                        `
                        Given the User Requirement: “ ${userRequirement} “, 
                        
                        return me remove updates to JSX code
                    
                        rules are: 
                        1. List out all the code that user wants to remove from given JSX code and return underlying text value of the html node, should be case insensitive
                        2. Updates should cover all the divs of react component, example names,  headers, descriptions, buttons..etc
                        3. Must escape double quotes with backslash, example: "hello \"world\"", so that I can parse using JSON.parse()
                        
                        Output should be json object with the following format:
                        [{"line": The line number on the code that need to be removed, "toberemovedtext": the text value of the html node that need to be removed },{},{}]
                        
                        If there is nothing to remove, return empty array
            
                        In the response no other text should be there, it must be only JSON. 
                        
                        Request: Response should be able to parse by javascript function JSON.parse(YourResponse), 
                        
                        Here is the JSX code to modify:
                    
                    \`\`\`jsx
                    
                    ${code}
                        `,
                        false
                    );
                    
                    updates = JSON.parse(resp);
                }
        }
        if(!updates){
            const resp = await generateResponse(
                `
                Given the User Requirement: “ ${userRequirement} “, 
                
                return me remove updates to JSX code
            
                rules are: 
                1. List out all the code that user wants to remove from given JSX code and return underlying text value of the html node, should be case insensitive
                2. Updates should cover all the divs of react component, example names,  headers, descriptions, buttons..etc
                3. Must escape double quotes with backslash, example: "hello \"world\"", so that I can parse using JSON.parse()
                
                Output should be json object with the following format:
                [{"line": The line number on the code that need to be removed, "toberemovedtext": the text value of the html node that need to be removed },{},{}]
                
                If there is nothing to remove, return empty array
    
                In the response no other text should be there, it must be only JSON. 
                
                Request: Response should be able to parse by javascript function JSON.parse(YourResponse), 
                
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
    
        // // console.log("===updates===", updates);

        if(!updates){
            return;
        }

       
        const baseAST = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});

        traverse(baseAST, {
            enter(path) {
                let lineUpdate = null;
        
                if (t.isJSXElement(path.node)) {
                    const elementString = generate(path.node).code;
                    const formattedElementString = elementString.replace(/\s/g, '');
                    lineUpdate = updates.find(u => {
                        const formattedUString = u.toberemovedtext.replace(/\s/g, '');
                        return formattedUString.toLowerCase() === formattedElementString.toLowerCase();
                    });
                } else if (t.isJSXText(path.node)) {
                    lineUpdate = updates.find(u => u.toberemovedtext.toLowerCase() === path.node.value.trim().toLowerCase());
                }
                
                if (lineUpdate) {
                    path.remove();
                }
            }
        });
                    
        let output;
        try {
            output = generate(baseAST).code;
            // // console.log("==syntax checked==cahtgptcode====", output);
        
            try {
            fs.writeFileSync(
                filePath,
                output,
                "utf8"
            );
            // // console.log("File successfully written!");
            } catch (err) {
            console.error(err);
            }
        } catch (error) {
            // // console.log("it's catch");
            console.error("Syntax error:", error.message);
            console.error("Stack trace:", error.stack);
        }
}

async function removeOperationByClassName(userRequirement, filePath) {
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
        
        return me remove updates to JSX code
    
        rules are: 
        1. List out all the code that user wants to remove from given JSX code and return class name of the html node
        2. Updates should cover all the divs of react component, example names,  headers, descriptions, buttons..etc
        3. Related divs should be removed together, for example if user wants to remove a button, and the button has text above button tag, both should be removed.
        4. Must escape double quotes with backslash, example: "hello \"world\"", so that I can parse using JSON.parse()
        
        Output should be json object with the following format:
        [{"line": The line number on the code that need to be removed, "classname": the class name of the html node that need to be removed },{},{}]
        
        If there is no code to remove, return empty array

        In the response no other text should be there, it must be only JSON. 
        
        Request: Response should be able to parse by javascript function JSON.parse(YourResponse), 
        
        Here is the JSX code to modify:
    
    \`\`\`jsx
    
    ${code}
        `,
        false
    );
    
    // // console.log("=====resp=====", resp);
    let updates;
    try {
    // Try to parse the input directly.
    updates = JSON.parse(resp);
    } catch(e) {
        let start = resp.indexOf('[');
        let end = resp.lastIndexOf(']') + 1;
        let jsonStr = resp.slice(start, end);
        
        // Replace single quotes around HTML with double quotes
        // and escape inner double quotes
        jsonStr = jsonStr.replace(/'<(.+?)>'/g, function(match, p1) {
            return '"<' + p1.replace(/"/g, '\\"') + '>"';
        });
        updates = JSON.parse(jsonStr);
    }        
        const baseAST = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});
    
        traverse(baseAST, {
            enter(path) {
                if (path.isJSXElement()) {
                    // Get className from node attributes
                    const classNameNode = path.node.openingElement.attributes.find(
                        attr => attr.type === "JSXAttribute" && attr.name.name === "className"
                    );
                    const classNameValue = classNameNode 
                        ? classNameNode.value.value 
                        : null;
        
                    // Find matching update by comparing className
                    const matchingNode = updates.find(node => {
                        // const nodeClassname = node.classname.match(/className="([^"]+)"/)[1];
                        return node.classname === classNameValue;
                    });
        
                    if (matchingNode) {
                        path.remove();
                    }
                }
            }
        });
        
        const { code: newCode } = generator(baseAST);
        // // console.log("--newCode----", newCode);

    
    let output;
    try {
        output = generate(baseAST).code;
        // // console.log("==syntax checked==cahtgptcode====", output);
    
        try {
        fs.writeFileSync(
            filePath,
            output,
            "utf8"
        );
        // // console.log("File successfully written!");
        } catch (err) {
        console.error(err);
        }
    } catch (error) {
        // // console.log("it's catch");
        console.error("Syntax error:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

module.exports = {
    checkForDesignChange,
    implementDesignChange,
    identifyUpdateSections,
    determineUpdateType,
    executeMessagingUpdate,
    executeBackgroundImageUpdate,
    determineSectionsDesignChange,
    updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation,
    removeOperation,
};




