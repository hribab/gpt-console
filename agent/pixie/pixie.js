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
  formatContextFromURL
} = require("./utils/createSkeleton");
const {
  createPixieConfigFile,
  updatePixieConfigStatus,
  renameProjectFolderIfExist
} = require("./config/pixieConfigOperations");

const {
  themeNames
} = require("./config/designSystems");


const fs = require("fs");
const path = require("path");

const { 
  checkForDesignChange,
  implementDesignChange,
  identifyUpdateSections,
  determineUpdateType,
  executeMessagingUpdate,
  executeBackgroundImageUpdate,
  removeOperation,
  determineSectionsDesignChange,
  updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation
} = require("./utils/updateOperation");
const { 
  extractTextAndMetaFromURLForEachSection,
  extractURLs
} = require("./utils/scrapeURL");

const initPixie = async (userRequirement, callback) => {
  try {
    
    const listOfURLFromRequirement = extractURLs(userRequirement)
    let contentFromFirstURL;
    if(listOfURLFromRequirement.length > 0){
      process.stdout.write(`\x1b[32m Extracting text for reference from ${listOfURLFromRequirement[0]} \x1b[0m \n`);
      contentFromFirstURL = await extractTextAndMetaFromURLForEachSection(listOfURLFromRequirement[0])
    }
    process.stdout.write(`\x1b[32m Moving existing pixie projects from current directory, they will be renamed to yourproject-old-currentDate-currentTime  \x1b[0m \n`);
    renameProjectFolderIfExist()
    const {designSystemZipURL, designSystemConfig, selectedDesignSystemName} = await pickRightDesignSystem(userRequirement, contentFromFirstURL);
    process.stdout.write(`\x1b[32m Grab your coffee and relax. I'm crafting your site, one pixel at a time.  \x1b[0m \n`);
    await downloadAndUnzip(designSystemZipURL);
    createPixieConfigFile({
      prompt: userRequirement,
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
          selectedDesignSystemName
        );
      }
    }
    updatePixieConfigStatus(`completed`);
    process.stdout.write(`\x1b[32m Finally! It's finished, and I'm running the app.  \x1b[0m \n`);
    
    const result = await runTheApp();
    return result;
  } catch (error) {
    // console.log("error", error);
    return `Error Occured, Please try again: ${error}`;
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const updatePixieOperation = async (userRequirement, callback) => {
    let isFullDesignChange = await checkForDesignChange(userRequirement);
    console.log("----isFullDesignChange------", isFullDesignChange)
    let data = fs.readFileSync('yourproject/pixieconfig.json', 'utf-8');
    let jsonData = JSON.parse(data);
    const selectedInternalDesignSystem = Object.keys(themeNames).find(key => themeNames[key] === jsonData.design);
    if(isFullDesignChange){ 
        await implementDesignChange(userRequirement, selectedInternalDesignSystem, jsonData.prompt, callback);
        return;
    }
    let sectionsDesignChange = await determineSectionsDesignChange(userRequirement, jsonData.prompt);
    console.log("===determineSectionsDesignChange====", sectionsDesignChange)
    
    await updateSpecificSectionCodeFilesForEnabledSectionsForUpdateOperation(sectionsDesignChange, userRequirement, selectedInternalDesignSystem, jsonData.prompt)

    let sectionsToUpdate = await identifyUpdateSections(userRequirement, jsonData.prompt);
    let updateOperationType = await determineUpdateType(userRequirement);
    
    let codeFilePaths = {};
    
    for (let section in sectionsToUpdate) {
      if (sectionsToUpdate[section]) {
        let fileName = `${section.charAt(0).toUpperCase()}${section.slice(1)}`
        if (section === "testmonials") {
            fileName = "Testimonials";
        }
        const filePath = `yourproject/src/components/Landingpage/${fileName}.js`;
        if (fs.existsSync(filePath)) {
          codeFilePaths[section] = filePath;
        }
      }
    }
    
    // // console.log("=====codeFilePaths=====", codeFilePaths, updateOperationType);

    for (let section in codeFilePaths) {
      if (updateOperationType.messaging) {
        await executeMessagingUpdate(userRequirement, codeFilePaths[section]);
      }
      if (updateOperationType.backgroundimage) {
        await executeBackgroundImageUpdate(userRequirement, codeFilePaths[section]);
      }
      if (updateOperationType.remove) {
        await removeOperation(userRequirement, codeFilePaths[section]);
      }
    }

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
