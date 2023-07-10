const {
  downloadAndUnzip,
  updateLandingPage,
  downloadCodeFile,
  generateMessaging,
  updateTheCodeWithImages,
} = require("./utils/createSkeleton");
const initPixie = async (userRequirement) => {
  try {
    // TODO: based on user requirement, pick the right design system and get the config and skeleton link that can be used below
    // await downloadAndUnzip(
    //   "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperkit%2Fyourproject.zip?alt=media&token=8788975f-fde3-4065-909b-558b3d1c3e43"
    // );
    const sections = {
      header: true,
      feature: false,
      blogs: false,
      teams: false,
      projects: false,
      pricing: false,
      testimonial: false,
      contactus: false,
      footer: false,
    };
    await updateLandingPage(sections);

    // // TODO: based on sections, download the code files

    // await downloadCodeFile(
    //   "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperkit%2Fheaders%2FHeader3.js?alt=media&token=bda16066-827f-467a-a3c0-05bd22847e3d",
    //   "yourproject/src/components/Landingpage/Header.js"
    // );
    // await generateMessaging(
    //   userRequirement,
    //   "yourproject/src/components/Landingpage/Header.js"
    // );
    // await updateTheCodeWithImages(
    //   userRequirement,
    //   "yourproject/src/components/Landingpage/Header.js"
    // );
  } catch (error) {
    //TODO: handle exception
    console.log("=====errror===", error);
  }
};

module.exports = {
  initPixie,
};
