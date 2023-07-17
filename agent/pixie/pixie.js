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
  designSystems
} = require("./config/designSystems");

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
    const {designSystemZipURL, designSystemConfig} = await pickRightDesignSystem(userRequirement);
    await downloadAndUnzip(designSystemZipURL);
    const enabledSectionsForRequirement = await identifyEnabledSections(userRequirement);
    const codeFilesForEnabledSections = await identifySpecificSectionCodeFilesForEnabledSections(userRequirement, enabledSectionsForRequirement, designSystemConfig);
    console.log("=====enabledSectionsForRequirement===", enabledSectionsForRequirement);
    await updateLandingPage(enabledSectionsForRequirement);

    // // TODO: based on sections, download the code files

    for (let section in enabledSectionsForRequirement) {
      if (enabledSectionsForRequirement[section]) { // If the section is true
        const link = codeFilesForEnabledSections[section];
        const path = `yourproject/src/components/Landingpage/${section.charAt(0).toUpperCase()}${section.slice(1)}.js`;
        console.log("=====path===", link, path)
        await downloadCodeFile(link, path);
        // await generateMessaging(
        //   userRequirement,
        //   path
        // );
        // await updateTheCodeWithImages(
        //   userRequirement,
        //   path
        // );
      }
    }

    
  } catch (error) {
    //TODO: handle exception
    console.log("=====errror===", error);
  }
};

const updatePixieOperation = async (userRequirement) => {
    console.log("=====updatePixieOperation=====", userRequirement);
    // let isDesignChange = checkForDesignChange(userRequirement);

    // if(isDesignChange){ 
    //     implementDesignChange();
    //     return;
    // }

    // let sectionsToUpdate = identifyUpdateSections();

    // let updateOperationType = determineUpdateType();

    // await executeMessagingUpdate(userRequirement, "yourproject/src/components/Landingpage/Header.js");
    await executeBackgroundImageUpdate(userRequirement, "yourproject/src/components/Landingpage/Header.js")
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
