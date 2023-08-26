const {
  pickRightDesignSystem,
  identifyEnabledSections,
  identifySpecificSectionCodeFilesForEnabledSections,
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages,
  runTheApp,
  formatContextFromURL,
  isRequirementForOnlyDocumentation
} = require("./utils/createSkeleton");
const {
  createPixieConfigFile,
  updatePixieConfigStatus,
  renameProjectFolderIfExist
} = require("./config/pixieConfigOperations");

const {
  themeNames
} = require("./config/designSystems");

const semver = require('semver'); // Use the 'semver' package to handle version comparison

const fs = require("fs");
const path = require("path");

const { 
  checkForDesignChange,
  implementDesignChange,
  determineDesignUpdateSections,
  determineBackgroundImageUpdateSections,
  determineUpdateType,
  executeMessagingUpdate,
  executeBackgroundImageUpdate,
  removeOperation,
  determineSectionsDesignChange,
  updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation,
  determineMessagingUpdateSections,
  checkForAddOrRemoveOperation
} = require("./utils/updateOperation");
const { 
  extractTextAndMetaFromURLForEachSection,
  extractURLs,
  buildHTMLDocumentationFile,
  downloadFromWebURL,
  formatContextFromRawData
} = require("./utils/scrapeURL");

const initPixie = async (userRequirement, callback) => {
  try {
    const listOfURLFromRequirement = extractURLs(userRequirement)
    renameProjectFolderIfExist() 

    if(listOfURLFromRequirement && listOfURLFromRequirement.length > 0){
      const documentationOnly = await isRequirementForOnlyDocumentation(userRequirement)
      // console.log("documentationOnly", documentationOnly)
      if(documentationOnly){
        try{
          process.stdout.write(`\x1b[32mOk, I got it. I'm working on building the documentation page.\x1b[0m\n`);
          process.stdout.write(`\x1b[32mExtracting text for reference from ${listOfURLFromRequirement[0]}.\x1b[0m\n`);
          const rawData = await downloadFromWebURL(listOfURLFromRequirement[0])
          if(!rawData){
            return;
          }
          const projectName = new URL(listOfURLFromRequirement[0]).hostname.split('.')[0];
          const upto30KCharecters = rawData.substring(0, 30000);
          const formattedData = await formatContextFromRawData(upto30KCharecters)
          if(formattedData){
            await buildHTMLDocumentationFile(formattedData, projectName, listOfURLFromRequirement[0])
          }
        }catch(e){
          return;
          // console.log("e-----", e)
        }
       
        return;
      }
    }

    const currentNodeVersion = process.versions.node;

    if (semver.lt(currentNodeVersion, '19.2.0')) {
        process.stdout.write(`\x1b[32mError: The current Node.js version is less than 19.2. Please update to a newer version.\x1b[0m \n`);
        return;
    }

    let contentFromFirstURL;
    if(listOfURLFromRequirement.length > 0){
      process.stdout.write(`\x1b[32m Extracting text for reference from ${listOfURLFromRequirement[0]} \x1b[0m \n`);
      contentFromFirstURL = await extractTextAndMetaFromURLForEachSection(listOfURLFromRequirement[0])
    }
    // console.log("contentFromFirstURL", contentFromFirstURL)
    let longerPromptForConfigFile = userRequirement;
    if(contentFromFirstURL && contentFromFirstURL["header"]){
      longerPromptForConfigFile = `${longerPromptForConfigFile} ${contentFromFirstURL["header"]["title"]}: ${contentFromFirstURL["header"]["description"]} `
    }
    // console.log("longerPromptForConfigFile", longerPromptForConfigFile)
 
    const {designSystemZipURL, designSystemConfig, selectedDesignSystemName} = await pickRightDesignSystem(userRequirement, longerPromptForConfigFile);
    process.stdout.write(`\x1b[32m Grab your coffee and relax. I'm crafting your site, one pixel at a time.  \x1b[0m \n`);
    await downloadAndUnzip(designSystemZipURL);
    createPixieConfigFile({
      prompt: longerPromptForConfigFile,
      mode: 'madmax',
      design: themeNames[selectedDesignSystemName],
      pixieversion: 1,
      time: new Date().toISOString(),
      status: 'progress'
    })
    const enabledSectionsForRequirement = await identifyEnabledSections(userRequirement);
    
    const codeFilesForEnabledSections = await identifySpecificSectionCodeFilesForEnabledSections(userRequirement, enabledSectionsForRequirement, designSystemConfig);

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
        let formMattedContextFromWebURL;
        if(contentFromFirstURL){
          formMattedContextFromWebURL = formatContextFromURL(section, contentFromFirstURL)
        }
        await generateMessaging(
          userRequirement,
          path,
          section,
          formMattedContextFromWebURL
        );

        await updateTheCodeWithImages(
          userRequirement,
          path,
          selectedDesignSystemName,
          formMattedContextFromWebURL
        );
      }
    }

    // updatePixieConfigStatus(`completed`);
    process.stdout.write(`\x1b[32m Finally! It's finished, and I'm running the app.  \x1b[0m \n`);
    // console.log("---runTheApp ====");

    const result = await runTheApp();
    process.stdout.write(`\x1b[32m ${result}  \x1b[0m \n`);

    return result;
  } catch (error) {
    // console.log("error", error);
    return;// `Error Occured, Please try again: ${error}`;
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const updatePixieOperation = async (userRequirement, callback) => {
    let jsonData;
    try {
      let data = fs.readFileSync('yourproject/pixieconfig.json', 'utf-8');
      jsonData = JSON.parse(data);
    } catch (err) {
      process.stdout.write(`\x1b[32mApologies, Can't update the doc page. How about we create a new site instead?\x1b[0m \n`);
      return;
      // console.error("File not found. Please ensure 'pixieconfig.json' is in the correct location.");
      // Handle error as needed, e.g., exit the process or throw a custom error
    }

    let isRemoveOperation = await checkForAddOrRemoveOperation(userRequirement);

    if(isRemoveOperation){ 
      process.stdout.write(`\x1b[32mApologies, but I can only update messaging, images, or designs.\x1b[0m \n`);
      process.stdout.write(`\x1b[32mFor additions or deletions, please do it manually: https://gptconsole.ai/guides.\x1b[0m \n`);
      return;
    }

    let isFullDesignChange = await checkForDesignChange(userRequirement, jsonData.prompt);
    const selectedInternalDesignSystem = Object.keys(themeNames).find(key => themeNames[key] === jsonData.design);
    if(isFullDesignChange){ 
        process.stdout.write(`\x1b[32m Sit back, enjoy your coffee, and relax. I'm starting from scratch to craft a brand-new site for you.  \x1b[0m \n`);
        await implementDesignChange(userRequirement, selectedInternalDesignSystem, jsonData.prompt, callback);
        const result = await runTheApp();
        process.stdout.write(`\x1b[32m ${result}  \x1b[0m \n`);
        return;
    }
    process.stdout.write(`\x1b[32m Alright, I got what you need. Please give me a few moments to implement the updates. \x1b[0m \n`);

    let updateOperationType = await determineUpdateType(userRequirement);

    // let sectionsToUpdate = await identifyUpdateSections(userRequirement, jsonData.prompt);
    if(updateOperationType.design){
      const enabledSections = await determineDesignUpdateSections(userRequirement, jsonData.prompt)
      await updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation(enabledSections, userRequirement, selectedInternalDesignSystem, jsonData.prompt, !updateOperationType.messaging, !updateOperationType.backgroundimage)
      return;
    }
    if (updateOperationType.messaging) {
      const enabledSections = await determineMessagingUpdateSections(userRequirement, jsonData.prompt)
      let codeFilePathsForMessaging = {};

      for (let section in enabledSections) {
        if (enabledSections[section]) {
          let fileName = `${section.charAt(0).toUpperCase()}${section.slice(1)}`
          if (section === "testmonials") {
              fileName = "Testimonials";
          }
          const filePath = `yourproject/src/components/Landingpage/${fileName}.js`;
          if (fs.existsSync(filePath)) {
            codeFilePathsForMessaging[section] = filePath;
          }
        }
      }
      for (let section in codeFilePathsForMessaging) {
        await executeMessagingUpdate(userRequirement, codeFilePathsForMessaging[section], section, jsonData.prompt);
      }
    }

    if (updateOperationType.backgroundimage) {
      const enabledSections = await determineBackgroundImageUpdateSections(userRequirement, jsonData.prompt)

      let codeFilePathsForBackgroundImage = {};

      for (let section in enabledSections) {
        if (enabledSections[section]) {
          let fileName = `${section.charAt(0).toUpperCase()}${section.slice(1)}`
          if (section === "testmonials") {
              fileName = "Testimonials";
          }
          const filePath = `yourproject/src/components/Landingpage/${fileName}.js`;
          if (fs.existsSync(filePath)) {
            codeFilePathsForBackgroundImage[section] = filePath;
          }
        }
      }
      for (let section in codeFilePathsForBackgroundImage) {
        await executeBackgroundImageUpdate(userRequirement, codeFilePathsForBackgroundImage[section]);
      }
    }
    // if (updateOperationType.remove) {
    //   process.stdout.write(`\x1b[32m I'm sorry, but version 1 only supports design changes, messaging updates, and background image generation. Please stay tuned for additions and deletions in version 2! \x1b[0m \n`);
    // }

    return;
    // await executeMessagingUpdate(userRequirement, "yourproject/src/components/Landingpage/Header.js");
    // await executeBackgroundImageUpdate(userRequirement, "yourproject/src/components/Landingpage/Header.js")
    // await removeOperation(userRequirement, "yourproject/src/components/Landingpage/Header.js")
    // if(updateOperationType.messagingUpdate){
    //     executeMessagingUpdate();
    //     return;
    // }
    // if(updateOperationType.backgroundUpdate){
    //   executeBackgroundImageUpdate();
    //     return;
    // }
    // if(updateOperationType.textUpdate){
    //     executeTextUpdate();
    //     return;
    // }
    // if(updateOperationType.removeElement){
    //     removeElement();
    //     return;
    // }
 
}


module.exports = {
  initPixie,
  updatePixieOperation
};
