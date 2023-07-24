const {
  pickRightDesignSystem,
  identifyEnabledSections,
  identifySpecificSectionCodeFilesForEnabledSections,
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages,
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

const initPixie = async (userRequirement, callback) => {
  try {
    renameProjectFolderIfExist()
    const {designSystemZipURL, designSystemConfig, selectedDesignSystemName} = await pickRightDesignSystem(userRequirement);
    createPixieConfigFile({
      prompt: userRequirement,
      mode: 'madmax',
      design: themeNames[selectedDesignSystemName],
      pixieversion: 1,
      time: new Date().toISOString(),
      status: 'progress'
    })
    await downloadAndUnzip(designSystemZipURL);
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
        await generateMessaging(
          userRequirement,
          path,
          section
        );
        await updateTheCodeWithImages(
          userRequirement,
          path,
          selectedDesignSystemName
        );
      }
    }    
    updatePixieConfigStatus('completed');

  } catch (error) {
    return callback(null, `Error Occured, Please try again: ${error}`);
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const updatePixieOperation = async (userRequirement, callback) => {
    let isFullDesignChange = await checkForDesignChange(userRequirement);
    let data = fs.readFileSync('yourproject/pixieconfig.json', 'utf-8');
    let jsonData = JSON.parse(data);
    const selectedInternalDesignSystem = Object.keys(themeNames).find(key => themeNames[key] === jsonData.design);
    if(isFullDesignChange){ 
        await implementDesignChange(userRequirement, selectedInternalDesignSystem, jsonData.prompt, callback);
        return;
    }
    let sectionsDesignChange = await determineSectionsDesignChange(userRequirement, jsonData.prompt);
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
    
    // console.log("=====codeFilePaths=====", codeFilePaths, updateOperationType);

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
