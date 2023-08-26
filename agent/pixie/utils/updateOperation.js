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
  

async function checkForAddOrRemoveOperation(userRequirement, originalPrompt) {
  return false;
  // const resp = await generateResponse(
  //     `
  //     Context: A client for whom I've recently developed a landing page for requirement ${originalPrompt}, has requested some modifications.

  //     Modification Request: "${userRequirement}"

  //     Given the client's request, please determine if their intention is to recreate the entire website.
  //     If the client appears dissatisfied with the existing landing page and seeks significant changes, interpret this as an intention to overhaul the entire website, thus return \`true\`. If the modifications seem minor and don't indicate a complete revamp, return \`false\`.

  //     Note: Please return a simple \`true\` or \`false\` response. No detailed explanation is necessary.
  //       `,
  //     false
  //   );
  //     if(typeof resp === 'boolean') {
  //         return resp;
  //     }
  //     else if(typeof resp === 'string') {
  //         return resp.toLowerCase().includes("true");
  //     }
  //     else {
  //         return false;
  //     }
}
async function checkForDesignChange(userRequirement, originalPrompt) {
    const resp = await generateResponse(
        `
        Context: A client for whom I've recently developed a landing page for requirement ${originalPrompt}, has requested some modifications.

        Modification Request: "${userRequirement}"

        Given the client's request, please determine if their intention is to recreate the entire website.
        If the client appears dissatisfied with the existing landing page and seeks significant changes, interpret this as an intention to overhaul the entire website, thus return \`true\`. If the modifications seem minor and don't indicate a complete revamp, return \`false\`.

        Note: Please return a simple \`true\` or \`false\` response. No detailed explanation is necessary.
          `,
        false
      );
        if(typeof resp === 'boolean') {
            return resp;
        }
        else if(typeof resp === 'string') {
            return resp.toLowerCase().includes("true");
        }
        else {
            return false;
        }
}
async function implementDesignChange(userRequirement, alreadySelectedDesignSystemName, existingPrompt, callback) {    
        try {
          renameProjectFolderIfExist()
          const {designSystemZipURL, designSystemConfig, selectedDesignSystemName} = await pickRightDesignSystemForUpdate(userRequirement, alreadySelectedDesignSystemName, existingPrompt);
        
          await downloadAndUnzip(designSystemZipURL);
          createPixieConfigFile({
            prompt: existingPrompt,
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
          return;  //callback(null, `Error Occured, Please try again: ${error}`);
        }
}
async function determineDesignUpdateSections(userRequirement, originalPrompt) {

    // userRequirement, to which code file has text ?
    
    const resp = await generateResponse(
        `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
        Now, the client wants to make some design(I mean the way landing page looks) modifications to this page.

        Client's Request for Modification: "${userRequirement}"
    
        I want you to determine probable sections that user wants to make changes to the design(I mean the way it looks) based on Request for Modification
        based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
        
        rules are:
        - If the requirement is not clear, return empty object {}
        - If the intention is to not change any section, set false for that section
        - If the user wants to change any section, set true for that section
          
        Available sections are:
        headers, features, blogs, teams, projects, pricing, testmonials, contactus
    
        Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
    
        Response should be json and Strictly NO explanation should be there in the response
    
        Request: Response should be able to parse by a below javascript function:
        
        
        function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
    
          `,
        false
      );
    
      // // // console.log("=====resp=====", resp);
      let enabledSections
      try {
        // Try to parse the input directly.
        enabledSections = JSON.parse(resp);
      } catch(e) {
        // // // console.log("====catch====", e)
        const resp = await generateResponse(
          `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
          Now, the client wants to make some design(I mean the way landing page looks) modifications to this page.
  
          Client's Request for Modification: "${userRequirement}"
      
          I want you to determine probable sections that user wants to make changes to the design(I mean the way it looks) based on Request for Modification
          based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
          
          rules are:
          - If the requirement is not clear, return empty object {}
          - If the intention is to not change any section, set false for that section
          - If the user wants to change any section, set true for that section
            
          Available sections are:
          headers, features, blogs, teams, projects, pricing, testmonials, contactus
      
          Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
      
          Response should be json and Strictly NO explanation should be there in the response
      
          Request: Response should be able to parse by a below javascript function:
          
          
          function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
      
            `,
          false
        );
        // // // console.log("=====resp2=====", resp);
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


async function determineBackgroundImageUpdateSections(userRequirement, originalPrompt) {

    // userRequirement, to which code file has text ?
    
    const resp = await generateResponse(
        `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
        Now, the client wants to change background image to this page.

        Client's Request for Modification: "${userRequirement}"
    
        I want you to determine probable sections that user wants to make changes to background image based on Request for Modification
        based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
        
        rules are:
        - If the requirement is not clear, return empty object {}
        - If the intention is to not change any section, set false for that section
        - If the user wants to change any section, set true for that section
          
        Available sections are:
        headers, features, blogs, teams, projects, pricing, testmonials, contactus
    
        Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
    
        Response should be json and Strictly NO explanation should be there in the response
    
        Request: Response should be able to parse by a below javascript function:
        
        
        function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
    
          `,
        false
      );
    
      // // // console.log("=====resp=====", resp);
      let enabledSections
      try {
        // Try to parse the input directly.
        enabledSections = JSON.parse(resp);
      } catch(e) {
        // // // console.log("====catch====", e)
        const resp = await generateResponse(
          `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
        
          Now, the client wants to change background image to this page.
  
          Client's Request for Modification: "${userRequirement}"
      
          I want you to determine probable sections that user wants to make changes to background image based on Request for Modification
          based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
          
          rules are:
          - If the requirement is not clear, return empty object {}
          - If the intention is to not change any section, set false for that section
          - If the user wants to change any section, set true for that section
            
          Available sections are:
          headers, features, blogs, teams, projects, pricing, testmonials, contactus
      
          Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
      
          Response should be json and Strictly NO explanation should be there in the response
      
          Request: Response should be able to parse by a below javascript function:

          function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
              
            `,
          false
        );
        // // // console.log("=====resp2=====", resp);
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

// async function determineUpdateTypedetermineUpdateType(userRequirement, originalPrompt) {
//     const resp = await generateResponse(
//         `Context: I recently developed a landing page for a client based on their initial requirements: "${originalPrompt}"

//         Now, the client has come back with some modification request: "${userRequirement}"

//         Landing page has total 8 sections, they are headers, features, blogs, teams, projects, pricing, testimonials, and contactus
        
//         I categorized modification requests into 3 types 1. design update 2. messaging update 3. background image update


//         If modification request is for messaging update(also known as text replacemnt or text change) or background image update just return empty JSON object {}
//         If modification request is for design update,
        
//         please determine the sections from the list:  headers, features, blogs, teams, projects, pricing, testimonials, contactus.
        
//         Response should be in JSON format, with each section represented by a boolean value - \`true\` or \`false\`. A \`true\` value indicates a proposed design change for that specific section.
        
//         For instance: 
//         {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testimonials": false, "contactus": false}
        
//         Response must be in JSON, NO other explanation or other text should be there in the response
        
//         Please adhere to the following rules:
//         - In case the client's intentions are not explicitly clear, return an empty JSON object ({})
//         - If the client does not wish to make any changes, again, return an empty JSON object ({})

        
//         Request: Response is strictly a JSON object devoid of any additional text, as it needs to be parsable by the following JavaScript function:
        
//         function parseResponse(YourResponse) { return JSON.parse(YourResponse) }        
        
//           `,
//         false
//       );
//       // console.log("=======res1p======", resp)

//       let enabledSections
//       try {
//         // Try to parse the input directly.
//         enabledSections = JSON.parse(resp);
//         // console.log("=======enabledSections1======", enabledSections)

//       } catch(e) {
//         const resp = await generateResponse(
//           `Context: I recently developed a landing page for a client based on their initial requirements: "${originalPrompt}"

//           Now, the client has come back with some modification request: "${userRequirement}"
  
//           Landing page has total 8 sections, they are headers, features, blogs, teams, projects, pricing, testimonials, and contactus
          
//           I categorized modification requests into 3 types 1. design update 2. messaging update 3. background image update
  
  
//           If modification request is for messaging update(also known as text replacemnt or text change) or background image update just return empty JSON object {}
//           If modification request is for design update,
          
//           please determine the sections from the list:  headers, features, blogs, teams, projects, pricing, testimonials, contactus.
          
//           Response should be in JSON format, with each section represented by a boolean value - \`true\` or \`false\`. A \`true\` value indicates a proposed design change for that specific section.
          
//           For instance: 
//           {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testimonials": false, "contactus": false}
          
//           Response must be in JSON, NO other explanation or other text should be there in the response
          
//           Please adhere to the following rules:
//           - In case the client's intentions are not explicitly clear, return an empty JSON object ({})
//           - If the client does not wish to make any changes, again, return an empty JSON object ({})
  
          
//           Request: Response is strictly a JSON object devoid of any additional text, as it needs to be parsable by the following JavaScript function:
          
//           function parseResponse(YourResponse) { return JSON.parse(YourResponse) }        
           
//             `,
//           false
//         ); 
//         // console.log("=======respt2======", resp)
//         try {
//           // Try to parse the input directly.
//           enabledSections = JSON.parse(resp);
//           // console.log("=======enabledSections2======", enabledSections)

//         } catch(e) {
//             enabledSections = {
//                 headers: false,
//                 features: false,
//                 blogs: false,
//                 teams: false,
//                 projects: false,
//                 pricing: false,
//                 testmonials: false,
//                 contactus: false,
//                 footer: false,
//               }
//         }
//       }
    
//       return  enabledSections;
// }


async function determineSectionsDesignChange(userRequirement, originalPrompt) {
    const resp = await generateResponse(
        `Context: I recently developed a landing page for a client based on their initial requirements: "${originalPrompt}"

        Now, the client has come back with some modification request: "${userRequirement}"

        Landing page has total 8 sections, they are headers, features, blogs, teams, projects, pricing, testimonials, and contactus
        
        I categorized modification requests into 3 types 1. design update 2. messaging update 3. background image update


        If modification request is for messaging update(also known as text replacemnt or text change) or background image update just return empty JSON object {}
        If modification request is for design update,
        
        please determine the sections from the list:  headers, features, blogs, teams, projects, pricing, testimonials, contactus.
        
        Response should be in JSON format, with each section represented by a boolean value - \`true\` or \`false\`. A \`true\` value indicates a proposed design change for that specific section.
        
        For instance: 
        {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testimonials": false, "contactus": false}
        
        Response must be in JSON, NO other explanation or other text should be there in the response
        
        Please adhere to the following rules:
        - In case the client's intentions are not explicitly clear, return an empty JSON object ({})
        - If the client does not wish to make any changes, again, return an empty JSON object ({})

        
        Request: Response is strictly a JSON object devoid of any additional text, as it needs to be parsable by the following JavaScript function:
        
        function parseResponse(YourResponse) { return JSON.parse(YourResponse) }        
        
          `,
        false
      );
    //   // console.log("=======res1p======", resp)

      let enabledSections
      try {
        // Try to parse the input directly.
        enabledSections = JSON.parse(resp);
        // // console.log("=======enabledSections1======", enabledSections)

      } catch(e) {
        const resp = await generateResponse(
          `Context: I recently developed a landing page for a client based on their initial requirements: "${originalPrompt}"

          Now, the client has come back with some modification request: "${userRequirement}"
  
          Landing page has total 8 sections, they are headers, features, blogs, teams, projects, pricing, testimonials, and contactus
          
          I categorized modification requests into 3 types 1. design update 2. messaging update 3. background image update
  
  
          If modification request is for messaging update(also known as text replacemnt or text change) or background image update just return empty JSON object {}
          If modification request is for design update,
          
          please determine the sections from the list:  headers, features, blogs, teams, projects, pricing, testimonials, contactus.
          
          Response should be in JSON format, with each section represented by a boolean value - \`true\` or \`false\`. A \`true\` value indicates a proposed design change for that specific section.
          
          For instance: 
          {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testimonials": false, "contactus": false}
          
          Response must be in JSON, NO other explanation or other text should be there in the response
          
          Please adhere to the following rules:
          - In case the client's intentions are not explicitly clear, return an empty JSON object ({})
          - If the client does not wish to make any changes, again, return an empty JSON object ({})
  
          
          Request: Response is strictly a JSON object devoid of any additional text, as it needs to be parsable by the following JavaScript function:
          
          function parseResponse(YourResponse) { return JSON.parse(YourResponse) }        
           
            `,
          false
        ); 
        // // console.log("=======respt2======", resp)
        try {
          // Try to parse the input directly.
          enabledSections = JSON.parse(resp);
        //   // console.log("=======enabledSections2======", enabledSections)

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

async function updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation(sectionsDesignChange, userRequirement, selectedInternalDesignSystem, originalRequirement, shouldUpdateMessaging, shouldUpdateBackgroundImages) {

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

            const subSection = allSubSections[Math.floor(Math.random() * allSubSections.length)];//ramdomly pick
            const link = designSystemConfig[section][subSection].codefile
            let fileName = `${section.charAt(0).toUpperCase()}${section.slice(1)}`
            if (section === "testmonials") {
                fileName = "Testimonials";
            }
            const path = `yourproject/src/components/Landingpage/${fileName}.js`;
            await downloadCodeFile(link, path);
            if(shouldUpdateMessaging){
                await generateMessaging(
                    `Initial prompt: ${originalRequirement}, User update request: ${userRequirement}`,
                    path,
                    section
                );

            }
            if(shouldUpdateBackgroundImages){
                
                    await updateTheCodeWithImages(
                        `Initial prompt: ${originalRequirement}, User update request: ${userRequirement}`,
                        path,
                        selectedInternalDesignSystem
                    );
            
            }
          }
        }
    }
}

async function determineUpdateType(userRequirement, originalPrompt) {
    const resp = await generateResponse(
        `Context: I recently crafted a landing page for a client, following their original requirements detailed as: "${originalPrompt}"

        Modification Request from the Client: "${userRequirement}"
        
        Your task is to ascertain the type of updates the client wishes to apply based on their modification request.
        
        Here are the rules to guide you:
        - If the requirement is ambiguous or unclear, return an empty JSON object: \`{}\`
        - If there is no indication of any changes required, also return an empty JSON object: \`{}\`
        
        The client's modifications can fall under the following categories:
        1. Design
        2. Messaging
        3. Backgroundimage
        4. Removal
        
        Your response should be a JSON object indicating which update categories the client intends to modify. Each category should be associated with a boolean value, where \`true\` represents an intention to modify, and \`false\` indicates no change.
        
        example output: \`{"design": false, "messaging": true, "backgroundimage": true, "remove": false}\`
        
        Please ensure that the response is strictly a JSON object without any additional text. This is crucial as the response needs to be parseable by the following JavaScript function:
        \`\`\`
        function parseResponse(YourResponse) { 
          return JSON.parse(YourResponse) 
        }
        \`\`\`
        
          `,
        false
      );
    
      let updateOperations
      try {
        // Try to parse the input directly.
        updateOperations = JSON.parse(resp);
      } catch(e) {
        const resp = await generateResponse(
          `Context: I recently crafted a landing page for a client, following their original requirements detailed as: "${originalPrompt}"

          Modification Request from the Client: "${userRequirement}"
          
          Your task is to ascertain the type of updates the client wishes to apply based on their modification request.
          
          Here are the rules to guide you:
          - If the requirement is ambiguous or unclear, return an empty JSON object: \`{}\`
          - If there is no indication of any changes required, also return an empty JSON object: \`{}\`
          
          The client's modifications can fall under the following categories:
          1. Design
          2. Messaging
          3. Backgroundimage
          4. Removal
          
          Your response should be a JSON object indicating which update categories the client intends to modify. Each category should be associated with a boolean value, where \`true\` represents an intention to modify, and \`false\` indicates no change.
          
          example output: \`{"design": false, "messaging": true, "backgroundimage": true, "remove": false}\`
          
          Please ensure that the response is strictly a JSON object without any additional text. This is crucial as the response needs to be parseable by the following JavaScript function:
          \`\`\`
          function parseResponse(YourResponse) { 
            return JSON.parse(YourResponse) 
          }
          \`\`\`
          
            `,
          false
        );  
        try {
          // Try to parse the input directly.
          updateOperations = JSON.parse(resp);
        } catch(e) {
            updateOperations = {
            design: false,
            messaging: false,
            backgroundimage: false,
            remove: false,
          }
        }
      }
    
      return updateOperations
}


async function executeMessagingUpdate(userRequirement, filePath, section, originalPrompt, formMattedContextFromWebURL=null) {
    // // console.log("---generateMessaging ====", section, userRequirement, originalPrompt );
  
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
        Given the User Orinal Requirement: “ ${originalPrompt} “, ${formMattedContextFromWebURL}
        Update request: ${userRequirement}

        Return me messaging updates to JSX code for section ${section} of landing page for  Update request: ${userRequirement}
        
        Rules are: 
        1. Most importantly, it should match user update request: ${userRequirement}
        2. The messaging should cover all the text in the JSX code
        3. Top text should be less than the text below it, for example branding text should be less than title text, title text should be less than description text
        4. Branding text should be less than 3 words, Title text should be less than 5 words, Description should be more than 10 words and less than 20 words
        5. Buttons text should be updated as well if any
        
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
  
    //   // console.log("---resp ====", resp);

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
                Given the User Orinal Requirement: “ ${originalPrompt} “, ${formMattedContextFromWebURL}
                Update request: ${userRequirement}

                Return me messaging updates to JSX code for section ${section} of landing page for  Update request: ${userRequirement}
                
                Rules are: 
                1. Most importantly, it should match user update request: ${userRequirement}
                2. The messaging should cover all the text in the JSX code
                3. Top text should be less than the text below it, for example branding text should be less than title text, title text should be less than description text
                4. Branding text should be less than 3 words, Title text should be less than 5 words, Description should be more than 10 words and less than 20 words
                5. Buttons text should be updated as well if any
                
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
            //   // console.log("---resp2 ====", resp);
            
              try{
                updates = JSON.parse(resp);  
              }catch(e) {
                // // console.log("---resp2error ====", e);
                updates = null
              }
             
            }
          }
        }
        if(!updates){
          const resp = await generateResponse(
            `
            Given the User Orinal Requirement: “ ${originalPrompt} “, ${formMattedContextFromWebURL}
            Update request: ${userRequirement}

            Return me messaging updates to JSX code for section ${section} of landing page for  Update request: ${userRequirement}
            
            Rules are: 
            1. Most importantly, it should match user update request: ${userRequirement}
            2. The messaging should cover all the text in the JSX code
            3. Top text should be less than the text below it, for example branding text should be less than title text, title text should be less than description text
            4. Branding text should be less than 3 words, Title text should be less than 5 words, Description should be more than 10 words and less than 20 words
            5. Buttons text should be updated as well if any
            
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
        
          // console.log("---resp3 ====", resp);

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
        // console.log("===updates===", updates);
        const baseAST = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});
  
        try {
           
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
        } catch(e) {
            // console.log("===error===", e);
        }
  
        // const { code: newCode } = generator(baseAST);
      // let ast;
      // try {
      //   ast = parser.parse(gtpCode, {
      //     sourceType: "module",
      //     plugins: ["jsx"],
      //   });
      // } catch (error) {
      //   // // console.log("it's parse catch");
      //   console.error("Syntax error:", error.message, error.stack);
      //   // const resp = await generateResponse(`There is a syntax error in the below javascript code. Please correct the syntax errors only.
      //   // response should has only the code, nothing else should be there in response
      //   // error: ${error.message}
      //   // stacktrace : ${error.stack.split('\n')[0]}
      //   // code: ${code}
      //   // `, false)
  
      //   // // // console.log("----res[====", resp)
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
        const regex = /strings:\s*\[([\s\S]*?)\]/;
        const match = output.match(regex);
        if(match && match[1]){
            const arrayString = match[1];
            const subStringArray = JSON.parse(`[${arrayString}]`);
            // console.log("=========subStringArray====", subStringArray)
            let lines;
            if(section.toLowerCase().includes("header") && subStringArray.length === 3){
            let allSubstringsPresent = subStringArray.every(subString => output.includes(subString));
            if(allSubstringsPresent){
                // console.log("=====lines ===", output)

                const resp = await generateResponse(
                `
                Given the User Orinal Requirement: “ ${originalPrompt} “
                New Update request: "${userRequirement}"

                In the New Update request, is user asking for NOT changing one of ${match} or any small intenstion to NOT changing  header dynamic text or scrolling text or moving text or changing the text..etc,

                if Yes, then you need to return empty json object {}

                if No, then you need to generate three succinct and compelling header lines, with a maximum of three words each, for a dynamic scrolling text display.
                These lines, serving as the primary points of attraction, should effectively encourage the user to take action by clicking the button
                
                example output: 
                {
                    headers:  ["line1", "line2", "line3"]
                }

                
                Response should be json and Strictly NO explanation should be there in the response
                
                Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
    
                    `,
                false
                );
                // console.log("=====lines resp===", resp)

                try {
                // Try to parse the input directly.
                lines = JSON.parse(resp);
                } catch(e) {
                const resp = await generateResponse(
                    `
                    Given the User Orinal Requirement: “ ${originalPrompt} “
                New Update request: "${userRequirement}"

                In the New Update request, is user asking for NOT changing one of ${match} or any small intenstion to NOT changing  header dynamic text or scrolling text or moving text or changing the text..etc,

                if Yes, then you need to return empty json object {}

                if No, then you need to generate three succinct and compelling header lines, with a maximum of three words each, for a dynamic scrolling text display.
                These lines, serving as the primary points of attraction, should effectively encourage the user to take action by clicking the button
                
                example output: 
                {
                    headers:  ["line1", "line2", "line3"]
                }

                
                Response should be json and Strictly, NO explanation should be there in the response
                
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
                Given the User Orinal Requirement: “ ${originalPrompt} “
                New Update request: "${userRequirement}"

                In the New Update request, is user asking for NOT changing one of ${match} or any small intenstion to NOT changing  header dynamic text or scrolling text or moving text or changing the text..etc,

                if Yes, then you need to return empty json object {}

                if No, then you need to generate three succinct and compelling header lines, with a maximum of three words each, for a dynamic scrolling text display.
                These lines, serving as the primary points of attraction, should effectively encourage the user to take action by clicking the button
                
                example output: 
                {
                    headers:  ["line1", "line2", "line3"]
                }

                
                Response should be json and Strictly, NO explanation should be there in the response
                
                Request: Response should be able to parse by javascript function => function parseLLMResponse(YourResponse){ return JSON.parse(YourResponse) }
    
                `,
                false
                );
                try {
                // Try to parse the input directly.
                lines = JSON.parse(resp);
                } catch(e) {
                //   lines = ["Scrollingfeature1", "Scrollingfeature1", "Scrollingfeature1"]
                }
            }
    
            // console.log("---lines ====", lines );
    
            if(lines && lines.headers && lines.headers.length > 0){
                for (let i = 0; i < subStringArray.length; i++) {
                output = output.split(subStringArray[i]).join(lines.headers[i]);
                }
            }
            }
        }

        try {
            // console.log("------final outoutp=====", output);
          fs.writeFileSync(
            filePath,
            output,
            "utf8"
          );
        } catch (err) {
          // console.log("------write eror=====", err);
        }
      } catch (error) {
        // console.log("------update error====", error);

        // console.error("Syntax error:", error.message);
        // console.error("Stack trace:", error.stack);
        return;
      }
  
  }

async function determineMessagingUpdateSections(userRequirement, originalPrompt){

        // userRequirement, to which code file has text ?
        
        const resp = await generateResponse(
            `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
            
            Now, the client wants to make some modifications to this page.
    
            Client's Request for Modification: "${userRequirement}"
        
            I want you to determine probable sections that user wants to make changes based on Request for Modification
            based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
            
            rules are:
            - If the requirement is not clear, return empty object {}
            - If the intention is to not change any section, set false for that section
            - If the user wants to change any section, set true for that section
              
            Available sections are:
            headers, features, blogs, teams, projects, pricing, testmonials, contactus
        
            Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
        
            Response should be json and Strictly NO explanation should be there in the response
        
            Request: Response should be able to parse by a below javascript function:
            
            function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
        
              `,
            false
          );
        
          // // // console.log("=====resp=====", resp);
          let enabledSections
          try {
            // Try to parse the input directly.
            enabledSections = JSON.parse(resp);
          } catch(e) {
            // // // console.log("====catch====", e)
            const resp = await generateResponse(
              `Context: I recently created a landing page for a client for original requirement:  ${originalPrompt}
            
              Now, the client wants to make some modifications to this page.
      
              Client's Request for Modification: "${userRequirement}"
          
              I want you to determine probable sections that user wants to make changes based on Request for Modification
              based on Request for Modification, Try to guess most likely sections headers, features, blogs, teams, projects, pricing, testmonials, contactus that user wants to make changes
              
              rules are:
              - If the requirement is not clear, return empty object {}
              - If the intention is to not change any section, set false for that section
              - If the user wants to change any section, set true for that section
                
              Available sections are:
              headers, features, blogs, teams, projects, pricing, testmonials, contactus
          
              Sample output: {"headers": true, "features": true, "blogs": false, "teams": false, "projects": false, "pricing": false, "testmonials": false, "contactus": false}
          
              Response should be json and Strictly NO explanation should be there in the response
          
              Request: Response should be able to parse by a below javascript function:
              
              function parseResponse(YourResponse){ return JSON.parse(YourResponse) }
          
                `,
              false
            );
            // // // console.log("=====resp2=====", resp);
            try {
              // Try to parse the input directly.
              enabledSections = JSON.parse(resp);
            } catch(e) {
              enabledSections = {
                headers: true,
                features: true,
                blogs: true,
                teams: true,
                projects: true,
                pricing: true,
                testmonials: true,
                contactus: true,
                footer: false,
              }
            }
          }
        
          return enabledSections
}
async function executeBackgroundImageUpdate(userRequirement, filePath) {
        let code;
        try {
            code = fs.readFileSync(filePath,'utf8');
        } catch (err) {
            console.error(err);
        }
        
        const imagePaths = extractImagePaths(code);
        // // // console.log("===replacing======", imagePaths);
    
        const result = {};
        for (let i = 0; i < imagePaths.length; i++) {
            await downloadComponentImages(userRequirement, `yourproject/src/${imagePaths[i].replace("assets/img", "assets/img/aigenerated")}`);
            result[imagePaths[i]] = imagePaths[i].replace("assets/img", "assets/img/aigenerated");
        }
        // // // console.log(result);
    
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
        
        // // // console.log("=====resp=====", resp);
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
    
        // // // console.log("===updates===", updates);

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
            // // // console.log("==syntax checked==cahtgptcode====", output);
        
            try {
            fs.writeFileSync(
                filePath,
                output,
                "utf8"
            );
            // // // console.log("File successfully written!");
            } catch (err) {
            console.error(err);
            }
        } catch (error) {
            // // // console.log("it's catch");
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
    
    // // // console.log("=====resp=====", resp);
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
        // // // console.log("--newCode----", newCode);

    
    let output;
    try {
        output = generate(baseAST).code;
        // // // console.log("==syntax checked==cahtgptcode====", output);
    
        try {
        fs.writeFileSync(
            filePath,
            output,
            "utf8"
        );
        // // // console.log("File successfully written!");
        } catch (err) {
        console.error(err);
        }
    } catch (error) {
        // // // console.log("it's catch");
        console.error("Syntax error:", error.message);
        console.error("Stack trace:", error.stack);
    }
}

module.exports = {
    checkForDesignChange,
    implementDesignChange,
    determineDesignUpdateSections,
    determineUpdateType,
    executeMessagingUpdate,
    executeBackgroundImageUpdate,
    determineSectionsDesignChange,
    updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation,
    removeOperation,
    determineMessagingUpdateSections,
    determineBackgroundImageUpdateSections,
    checkForAddOrRemoveOperation
};




