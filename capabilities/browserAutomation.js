async function getHTMLData(url) {
    // Launch a headless browser
    const browser = await puppeteer.launch();
    
    // Open a new page
    const page = await browser.newPage();
    
    // Navigate to the specified URL
    await page.goto(url);
    
    // Get the HTML content of the page
    const htmlData = await page.content();
    
     
    const chatgptresponse = await generateResponse(`generate automation test plan for below html code  htmlcode: ${htmlData}`, false);
    console.log("-----", chatgptresponse)
    // Close the browser
    await browser.close();
    
    // Return the HTML data
    return htmlData;
}
  


const browser = async () => {  
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        userDataDir: '/Users/hari/Library/Application Support/Google/Chrome/Default', // Replace with your actual user data directory path
        slowMo: 1000,
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Now you can interact with the browser as usual
    const page = await browser.newPage();
    await page.goto('https://sunpower--qa.sandbox.my.site.com/apex/CHome?sfdc.tabName=01r340000004dsw') //https://gmail.com');
    
 page.$$eval('a[href]'

 const hrefElements = await page.$$eval('a[href]', (links) => links.map(a => {
    const getNearestDiv = (el) => {
        let parent = el.parentElement;
        while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
            parent = parent.parentElement;
        }
        return parent ? parent.outerHTML : null;
    };
    
    return { 
        link: a.outerHTML, 
        enclosingDiv: getNearestDiv(a)
    };
}));

  const buttonElements = await page.$$eval('button', (buttons) => buttons.map(button => {
    const getNearestDiv = (el) => {
      let parent = el.parentElement;
      while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
          parent = parent.parentElement;
      }
      return parent ? parent.outerHTML : null;
  };
    return {
      button: button.outerHTML,
      enclosingDiv: getNearestDiv(button)
    };
  }));

  const divsWithOnClick = await page.$$eval('div[onclick]', (divs) => divs.map(div => {
    const getNearestDiv = (el) => {
      let parent = el.parentElement;
      while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
          parent = parent.parentElement;
      }
      return parent ? parent.outerHTML : null;
  };
    return {
      onclick: div.outerHTML,
      enclosingDiv: getNearestDiv(div)
    };
  }));

  const clickableElements = await page.$$eval('[role="button"], [tabindex]', (elements) => elements.map(el => {
    const getNearestDiv = (el) => {
      let parent = el.parentElement;
      while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
          parent = parent.parentElement;
      }
      return parent ? parent.outerHTML : null;
  };
    return {
      element: el.outerHTML,
      enclosingDiv: getNearestDiv(el)
    };
  }));

  const selectElements = await page.$$eval('select option', (options) => options.map(option => {
    const getNearestDiv = (el) => {
      let parent = el.parentElement;
      while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
          parent = parent.parentElement;
      }
      return parent ? parent.outerHTML : null;
  };
    return {
      option: option.outerHTML,
      enclosingDiv: getNearestDiv(option)
    };
  }));

  const navItems = await page.$$eval('nav li', (items) => items.map(item => {
    const getNearestDiv = (el) => {
      let parent = el.parentElement;
      while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
          parent = parent.parentElement;
      }
      return parent ? parent.outerHTML : null;
  };
    return {
      item: item.outerHTML,
      enclosingDiv: getNearestDiv(item)
    };
  }));

  console.log("Href elements and their enclosing divs: ", hrefElements.length);
  console.log("Button elements and their enclosing divs: ", buttonElements.length);
  console.log("Divs with onclick and their enclosing divs: ", divsWithOnClick.length);
  console.log("Clickable elements and their enclosing divs: ", clickableElements.length);
  console.log("Select elements and their enclosing divs: ", selectElements.length);
  console.log("Navigation items and their enclosing divs: ", navItems.length);

    // await browser.close();
}




// const browser = async () => {  
//   try{
//   const browser = await puppeteer.launch({
//       executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
//       userDataDir: '/Users/hari/Library/Application Support/Google/Chrome/Profile 1', // Replace with your actual user data directory path
//       slowMo: 1000,
//       headless: false,
//       defaultViewport: null,
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });

//   // Now you can interact with the browser as usual
//   const page = await browser.newPage();
//   await page.goto('https://sunpower--qa.sandbox.my.salesforce.com/home/home.jsp') //https://gmail.com');
  


// const hrefElements = await page.$$eval('a[href]', (links) => links.map(a => {
//   const getNearestDiv = (el) => {
//       let parent = el.parentElement;
//       while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
//           parent = parent.parentElement;
//       }
//       return parent ? parent.outerHTML : null;
//   };
  
//   return { 
//       link: a.outerHTML, 
//       enclosingDiv: getNearestDiv(a),
//       text: a.textContent
//   };
// }));

// const buttonElements = await page.$$eval('button', (buttons) => buttons.map(button => {
//   const getNearestDiv = (el) => {
//     let parent = el.parentElement;
//     while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
//         parent = parent.parentElement;
//     }
//     return parent ? parent.outerHTML : null;
// };
//   return {
//     button: button.outerHTML,
//     enclosingDiv: getNearestDiv(button)
//   };
// }));

// const divsWithOnClick = await page.$$eval('div[onclick]', (divs) => divs.map(div => {
//   const getNearestDiv = (el) => {
//     let parent = el.parentElement;
//     while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
//         parent = parent.parentElement;
//     }
//     return parent ? parent.outerHTML : null;
// };
//   return {
//     onclick: div.outerHTML,
//     enclosingDiv: getNearestDiv(div)
//   };
// }));

// const clickableElements = await page.$$eval('[role="button"], [tabindex]', (elements) => elements.map(el => {
//   const getNearestDiv = (el) => {
//     let parent = el.parentElement;
//     while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
//         parent = parent.parentElement;
//     }
//     return parent ? parent.outerHTML : null;
// };
//   return {
//     element: el.outerHTML,
//     enclosingDiv: getNearestDiv(el)
//   };
// }));

// const selectElements = await page.$$eval('select option', (options) => options.map(option => {
//   const getNearestDiv = (el) => {
//     let parent = el.parentElement;
//     while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
//         parent = parent.parentElement;
//     }
//     return parent ? parent.outerHTML : null;
// };
//   return {
//     option: option.outerHTML,
//     enclosingDiv: getNearestDiv(option)
//   };
// }));

// const navItems = await page.$$eval('nav li', (items) => items.map(item => {
//   const getNearestDiv = (el) => {
//     let parent = el.parentElement;
//     while (parent !== null && parent.tagName.toLowerCase() !== 'div') {
//         parent = parent.parentElement;
//     }
//     return parent ? parent.outerHTML : null;
// };
//   return {
//     item: item.outerHTML,
//     enclosingDiv: getNearestDiv(item)
//   };
// }));

  
//   const finalPrompt = `The objective of this task is to identify right div to click for one of feature automation testing
// 1. Instructions from developer are : go to home page => click on any 'user' from recent items list,  that screen has "Log in to Experience as User"
// 2. given html divs are all home page components
// 3. Final goal is to follow the instructions and  find "Log in to Experience as User" option from drop down
// 4. Parse all given html div, choose right div to click. which has high probability of reachout our goal

// HTML DIVs
// ${hrefElements.map(i => i["text"]).join(" ")}
// `;

//   console.log("======final proble=====", finalPrompt)

//   // const response = await generateResponse(finalPrompt);
//   // console.log("======response=====", response)

//   // ${navItems.map(i => i["item"]).join(" ")}

//   // hrefElements.map(i => console.log("=======", i["link"]))

//   // console.log("Href elements and their enclosing divs: ", hrefElements.);

//   // 130
 
//   // "Instructions from developer are : go to home page => click on any 'user' from recent items list,  that screen has "Log in to Experience as User"



  
//   // console.log("Button elements and their enclosing divs: ", buttonElements.length);
//   // console.log("Divs with onclick and their enclosing divs: ", divsWithOnClick.length);
//   // console.log("Clickable elements and their enclosing divs: ", clickableElements.length);
//   // console.log("Select elements and their enclosing divs: ", selectElements.length);
//   // console.log("Navigation items and their enclosing divs: ", navItems.length);

//   // await browser.close();
// } catch (error) {
//   console.error("Error occurred: ", error);
// }
// }
