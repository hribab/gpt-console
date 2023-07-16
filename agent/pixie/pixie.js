const {
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages,
} = require("./utils/createSkeleton");

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
    // TODO: based on user requirement, pick the right design system and get the config and skeleton link that can be used below
    // await downloadAndUnzip(
    //   "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperkit%2Fyourproject.zip?alt=media&token=8788975f-fde3-4065-909b-558b3d1c3e43"
    // );
    // await downloadAndUnzip(
    //   "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fyourproject.zip?alt=media&token=79d2fe5d-71db-4eb7-8369-50cff7a3b685"
    // );
    const sections = {
      header: false,
      feature: false,
      blogs: false,
      teams: false,
      projects: true,
      pricing: true,
      testimonial: true,
      contactus: true,
      footer: false,
    };
    const links = {
      header: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fheaders%2FHeader6.js?alt=media&token=bf186457-6ca1-4857-8bc7-4bcaaa6ddbf6",
      feature: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Ffeatures%2FFeatures5.js?alt=media&token=64fb79c5-c552-4126-806b-ad68b4d00b8d",
      blogs: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fblogs%2FBlogs7.js?alt=media&token=4620e9b3-5870-497b-8807-4c63532b34b5",
      teams: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fteams%2FTeams3.js?alt=media&token=7da4fa78-f7a7-41d9-aefe-add3e9c03113",
      projects: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fprojects%2FProjects3.js?alt=media&token=6a28e6d8-ef44-4df9-990e-58e702082a9f",
      pricing: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fpricing%2FPricing3.js?alt=media&token=ccb4edf9-2d4b-47ec-9ec5-17828469b96b",
      testimonial: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Ftestimonials%2FTestimonials3.js?alt=media&token=f94e77fd-e254-4d05-b819-3254bc1e07ec",
      contactus: "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fcontactus%2FContactUs3.js?alt=media&token=08a8c601-85d9-4828-9935-3410d7cd4820",
      footer: false,
    };
    // await updateLandingPage(sections);

    // TODO: based on sections, download the code files

    for (let section in sections) {
      if (sections[section]) { // If the section is true
        const link = links[section];
        const path = `yourproject/src/components/Landingpage/${section.charAt(0).toUpperCase()}${section.slice(1)}.js`;
        await downloadCodeFile(link, path);
        await generateMessaging(
          userRequirement,
          path
        );
        await updateTheCodeWithImages(
          userRequirement,
          path
        );
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
