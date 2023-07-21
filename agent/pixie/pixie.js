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
} = require("./utils/updateOperation");

const initPixie = async (userRequirement) => {
  try {
    const {designSystemZipURL, designSystemConfig, selectedDesignSystemName} = await pickRightDesignSystem(userRequirement);
    await downloadAndUnzip(designSystemZipURL);
    const enabledSectionsForRequirement = await identifyEnabledSections(userRequirement);

    const codeFilesForEnabledSections = await identifySpecificSectionCodeFilesForEnabledSections(userRequirement, enabledSectionsForRequirement, designSystemConfig);

    await updateLandingPage(enabledSectionsForRequirement);

    // // TODO: based on sections, download the code files

    for (let section in enabledSectionsForRequirement) {
      if (enabledSectionsForRequirement[section]) { // If the section is true
        const link = codeFilesForEnabledSections[section];
        const path = `yourproject/src/components/Landingpage/${section.charAt(0).toUpperCase()}${section.slice(1)}.js`;
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

    
  } catch (error) {
    //TODO: handle exception
    console.log("=====errror===", error);
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const updatePixieOperation = async (userRequirement) => {
    console.log("=====updatePixieOperation=====", userRequirement);
    let isDesignChange = await checkForDesignChange(userRequirement);
    console.log("=====isDesignChange=====", isDesignChange);
    // TODO the desing change
    // if(isDesignChange){ 
    //     implementDesignChange();
    //     return;
    // }

    let sectionsToUpdate = await identifyUpdateSections(userRequirement);
    console.log("=====sectionsToUpdate=====", sectionsToUpdate);
    let updateOperationType = await determineUpdateType(userRequirement);
    console.log("=====updateOperationType=====", updateOperationType);
    
    const baseFilePath = 'yourproject/src/components/Landingpage/';
    let codeFilePaths = {};
    
    for (let section in sectionsToUpdate) {
      if (sectionsToUpdate[section]) {
        let filePath = path.join(baseFilePath, `${capitalizeFirstLetter(section)}.js`);
        if (fs.existsSync(filePath)) {
          codeFilePaths[section] = filePath;
        }
      }
    }
    
    console.log("=====codeFilePaths=====", codeFilePaths, updateOperationType);

    for (let section in codeFilePaths) {
      if (updateOperationType.messaging) {
        console.log("=====executeMessagingUpdate=====", codeFilePaths[section]);
        await executeMessagingUpdate(userRequirement, codeFilePaths[section]);
      }
      if (updateOperationType.backgroundimage) {
        console.log("=====executeBackgroundImageUpdate=====", codeFilePaths[section]);
        await executeBackgroundImageUpdate(userRequirement, codeFilePaths[section]);
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
