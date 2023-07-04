const { generateResponse, generateResponseWithFunctions } = require("../utils/api/apiCall");
const fs = require('fs');
const { getRemoteFile } = require("../utils/getRemoteFile");
const { createSkeleton } = require("../utils/pixie/createSkeleton");
const { findElementFromObj } = require("../utils/common");

async function startPixie() {
  const skeletonFiles = {
    "nowui": {
      "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fnowuiskeleton.zip?alt=media&token=0e0ffc1f-efa9-4f5c-a307-c326a0bb2e28",
      "config": ""
    },
    "paperui": {
      "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperskeleton.zip?alt=media&token=ed05ee05-04c2-460f-b894-08c68de040b6",
      "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperuiconfig.json?alt=media&token=566ae342-d5e0-47c0-a14d-4c798810383f"
    }
  }

  const designSystems = {
    "blk": {
        "description": "The dark theme and sleek, modern design of this system can lend an air of sophistication and innovation to your landing page. This can be particularly effective if your product or service is tech-oriented or you're targeting a younger demographic."
    },
    "material": {
        "description": "Material Design's clean, simple, and intuitive interfaces can help visitors quickly understand your product or service, making it a good choice for a landing page. This design system's straightforwardness could be especially beneficial if your offering is complex or technical and you want to present it in an easily digestible way."
    },
    "paperui": {
        "description": "With its unique, sketch-like aesthetic, the Paper Kit can give your landing page a distinctive and friendly look and feel. This could be a good choice if you're aiming for an informal or artistic vibe or want your brand to seem more approachable."
    },
    "nowui": {
        "description": "Known for its vibrant colors and clean lines, the Now UI Kit can make your landing page appear professional and energetic. This could be a fitting choice if you want your brand to come across as both reliable and dynamic."
    }
  };

  // TODO: make it dynamic
  const userRequirement = "i want landing page for nursing application";
  const designPickPrompt = `i want you to pick design systems from given list, for the requirement "${userRequirement}"
   list is:  ${JSON.stringify(designSystems)}
   pick one from the list. sample output: "designsystem"
  `
  // console.log("designPickPrompt ", designPickPrompt)
  // const selectedDesignSys = await generateResponse(designPickPrompt);
  const selectedDesignSys = "paperui";
  // console.log("selectedDesignSys is ", selectedDesignSys)

  // download the design system
  // unzip the folder and put in the current directory
  const selectedDesignSkeletonUrl = skeletonFiles[selectedDesignSys]["skeleton"];
  await createSkeleton(selectedDesignSkeletonUrl);  

  const selectedDesignConfigUrl = skeletonFiles[selectedDesignSys]["config"];
  const selectedDesignConfig = JSON.parse(await getRemoteFile(selectedDesignConfigUrl));
  // console.log("selectedDesignConfig ", selectedDesignConfig)

  // check what sections are available in the config and then ask gpt to select
  const sectionsInConfig = Object.keys(selectedDesignConfig);
  const landingPageSections = sectionsInConfig.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});

  // TODO: check if the response is valid 
  const sectionsPickPrompt = `i want you to pick section from given list, for the requiremnt "${userRequirement}"
    list is:  ${JSON.stringify(landingPageSections)}
    set true for all the selected sections in the list and return the updated list in json format and don't include explanation in the response.
  `
  // console.log("sectionsPickPrompt ", sectionsPickPrompt)
  const rawSelectedSections = await generateResponse(sectionsPickPrompt);
  const updatedSections = JSON.parse(rawSelectedSections);
  // console.log("updatedSections is ", updatedSections)

  // update the order of sections in updatedSections for the page
  const reorderSectionsPrompt = `i want you to reorder the sections from given list, for the requiremnt "${userRequirement}"
    list is:  ${JSON.stringify(updatedSections)}
    return the updated list in json format and don't include explanation in the response.
  `
  // console.log("reorderSectionsPrompt ", reorderSectionsPrompt)
  const rawReorderedSections = await generateResponse(reorderSectionsPrompt);
  const reorderedSections = JSON.parse(rawReorderedSections);
  // console.log("reorderedSections ", reorderedSections)


  // for each selected section ask gpt to pick one from list 
  // for e.g. header1 or 2 or 3 etc ....
  for (const key in reorderedSections) {
    if (reorderedSections.hasOwnProperty(key) && reorderedSections[key] === true) {
      const pickSectionPrompt = `i want you to pick one ${key} from given list based on suitability for the requiremnt "${userRequirement}"
      list is:  ${JSON.stringify(selectedDesignConfig[key])}
      return one item key as string without quotes from the list and don't include explanation in the response.
    `
      // console.log("pickSectionPrompt ", pickSectionPrompt)
      let selectedSection = await generateResponse(pickSectionPrompt);
      console.log("selectedSection is ", selectedSection);


      // get the file and include it in the skeleton
      // console.log("selectedDesignConfig ", selectedDesignConfig)
      const selectedSectionConfig = findElementFromObj(selectedDesignConfig, selectedSection);
      // const rootKey = selectedSection.slice(0, - 1) + 's';
      // console.log("rootKey is ", rootKey)
      // console.log("selectedSection is ", selectedSection)
      // // console.log("key is ", key)
      // const sectionCode = await getRemoteFile(selectedDesignConfig[rootKey][selectedSection]["codefile"]);
      const sectionCode = await getRemoteFile(selectedSectionConfig["codefile"]);
      // write this file into dir
      // TODO: make this dynamic
      const fileName = selectedSection.charAt(0).toUpperCase() + selectedSection.substring(1, selectedSection.length - 1) + '.js';
      fs.writeFile(`/paperskeleton/src/components/${fileName}`, sectionCode, (error) => {
        if (error) {
          console.error('Error writing file:', error);
        } else {
          console.log(`File "${fileName}" created successfully.`);
        }
      });
    }
  }
};

module.exports = {
  startPixie
}
