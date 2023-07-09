#!/usr/bin/env node

const repl = require("repl");
const http = require("http");
// const puppeteer = require('puppeteer');
const spinners = require("cli-spinners");
const pmx = require('pmx');
const pm2 = require('pm2');
const readline = require('readline');
const ctags = require('ctags');
var natural = require('natural');

// const puppeteer = require('puppeteer');
// const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const { Browser } = require('puppeteer');
const clipboardy = require('clipboardy');
const { executablePath } = require('puppeteer');
const { waitForDebugger } = require('inspector');
//puppeteer.use(stealthPlugin());
let twitterActions;
let waitTime;

// const JavaScriptObfuscator = require('javascript-obfuscator');
// let obfuscatedCode = JavaScriptObfuscator.obfuscate(
//     'your-javascript-code-here',
//     {
//         compact: true,
//         controlFlowFlattening: true
//     }
// );

const { validateCommandInputs } = require('./utils/validation/scriptValidation');
const { codeLint } = require('./commands/codeLint');
const { codeOptimize } = require('./commands/codeOptimization')
const { codeRefactor } = require('./commands/codeRefactoring')
const { codeReview } = require('./commands/codeReview')
const { errorHandling } = require('./commands/errorHandling')
const { generateDocumentation } = require('./commands/generateDoc')
const { generateUnitTests } = require('./commands/generateUnitTestCases')
const { performanceProfiling } = require('./commands/performanceProfiling')
const { scanForBugs } = require('./commands/scanForBugs')
const { executeSystemCommand } = require('./commands/systemCommands')
const { scanForSecurity } = require('./commands/securityAudit')
const { handleDefaultCase } = require('./commands/defaultCommand')
const { completerFunc, welcomeMessage } = require('./utils/helper/cliHelpers')
const { generateResponse, generateResponseWithFunctions } = require("./utils/api/apiCall");
const { cleanFileForPrompt } = require("./utils/scripts/fileOperations");
const { GENERATE_UNIT_TEST } = require("./prompts/command/cliCommands");
// const puppeteer = require('puppeteer-core');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY 
});
const openai = new OpenAIApi(configuration);

var PouchDB = require('pouchdb');

const PineconeClient = require("@pinecone-database/pinecone").PineconeClient;

const pinecone = new PineconeClient();


const nonCodeFileExtensions = [
  '.min.js',
  '.map',
  '.json',
  '.txt',
  '.md',
  '.html',
  '.xml',
  '.css',
  '.lock',
];
const foldersToIgnore = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.vscode',
  '.idea',
  'public',
  'logs',
  '.cache',
  'pouchdb',
];

const commentSyntax = {
  '.js': /^(\/\*|\/\/)/,
  '.ts': /^(\/\*|\/\/)/,
  '.py': /^#/,
  '.java': /^(\/\*|\/\/)/,
  '.c': /^(\/\*|\/\/)/,
  '.cpp': /^(\/\*|\/\/)/,
  '.cxx': /^(\/\*|\/\/)/,
  '.cc': /^(\/\*|\/\/)/,
  '.h': /^(\/\*|\/\/)/,
  '.hpp': /^(\/\*|\/\/)/,
  '.cs': /^(\/\*|\/\/)/,
  '.rb': /^#/,
  '.php': /^(\/\*|\/\/|#)/,
  '.swift': /^(\/\*|\/\/)/,
  '.kt': /^(\/\*|\/\/)/,
  '.go': /^(\/\*|\/\/)/,
  '.rs': /^(\/\*|\/\/)/,
  '.scala': /^(\/\*|\/\/)/,
  '.pl': /^#/,
  '.pm': /^#/,
  '.sh': /^#/,
  '.ps1': /^#/,
  '.sql': /^(--|\/\*)/,
  '.json': null, // JSON doesn't support comments.
  '.xml': /^<!--/,
  '.yaml': /^#/,
  '.yml': /^#/,
  '.md': null, // Markdown doesn't have a comment syntax.
  '.bat': /^REM/,
  '.cmd': /^REM/,
  '.m': /^(%|\/\*)/,
  '.r': /^#/,
  '.lua': /^--/,
  '.dart': /^(\/\*|\/\/)/,
  '.groovy': /^(\/\*|\/\/)/,
  '.hs': /^--/,
  '.jl': /^#/,
  '.vb': /^'/,
  '.sh': /^#/,
};


// const fs = require('fs');
const fs = require('fs-extra');

const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);


const pixieBot = () => {
 

}


const stripQuotes = (input) => {
  return input.replace(/^"(.*)"$/, '$1');
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
const { Queue, Worker, QueueEvents, FlowProducer } = require('bullmq');

const directoryPath = `${process.cwd()}/`;
const pouchDBPath = `${process.cwd()}/pouchdb/`;

// Create or open the PouchDB database
const db = new PouchDB(pouchDBPath);

const tokenizeAndSave = async (fileContent) => {
  var tokenizer = new natural.WordTokenizer();

  let tokens = tokenizer.tokenize(fileContent.toLowerCase());
  let filteredTokens = tokens.filter(token => token.length > 3);

  // Remove duplicates by converting the array to a set
  let uniqueTokens = new Set(filteredTokens);

  // Convert the set back to an array if needed
  let uniqueTokensArray = Array.from(uniqueTokens);

  // Get existing terms from the database
  let existingTermsDoc;
  try {
    existingTermsDoc = await db.get('stackterms');
  } catch (error) {
    console.log('Could not find existing terms, creating a new entry');
    existingTermsDoc = {
      _id: 'stackterms',
      alltheterms: '',
      timeupdated: new Date().toISOString()
    }
  }

  let existingTerms = existingTermsDoc.alltheterms.split(",");

  // Combine existing and new terms
  let combinedTerms = [...existingTerms, ...uniqueTokensArray];

  // Remove duplicates
  let updatedTermsSet = new Set(combinedTerms);

  // Convert the set back to an array and then to a string
  let updatedTermsArrayString = Array.from(updatedTermsSet).join(",");

  // Save updated terms to the database
  try {
    await db.put({
      _id: existingTermsDoc._id,
      _rev: existingTermsDoc._rev,
      alltheterms: updatedTermsArrayString,
      timeupdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving updated terms', error);
  }
}


const searchAndReturn = async (filePath) => {
      const fileStream = fs.createReadStream(filePath);
  
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
  
      let buffer = Array(5).fill(null);
      let index = 0;
      let postBuffer = [];
      let isBufferingPostLines = false;
      const fileType = path.extname(filePath);
      const commentRegex = commentSyntax[fileType];
  
      for await (const line of rl) {
        if (commentRegex && commentRegex.test(line.trim())) {
          continue;
        }
        if (isBufferingPostLines) {
          postBuffer.push(line);
  
          if (postBuffer.length === 5) {
            console.log(postBuffer.join('\n'));
            postBuffer = [];
            isBufferingPostLines = false;
          }
        } else if (line.includes(searchTerm)) {
          console.log("========results=====", [...buffer.slice(index), ...buffer.slice(0, index), line]);
          isBufferingPostLines = true;
        }
  
        buffer[index] = line;
        index = (index + 1) % 5;
      }
  
      // If there are remaining lines in the postBuffer after the loop, print them
      if (postBuffer.length > 0) {
        console.log(postBuffer.join('\n'));
      }
}

const getComponentsForFile = async (fileContent) => { 

  const finalPrompt = `The task is to parse javascript code and breakdown the provided code into logical regions
  Requirements are: 
  1. Remove commented code or dead code
  2. Each function, method or class or block of code should be a separate region
  3. Write title and summary for each region
  4. Write descripiton for every variable, function, class
  
  The response should be in json format,  example output: [{title: "", description: , code: }, {}, {}..etc]
  
  code should be complete, never use ... or .etc 

  code: \n
  
  ${fileContent}`;

  // await runSpinnerAndSaveResponse(finalPrompt, fileName, "unittests");
  console.log("finalPrompt===>", finalPrompt);
  const response = await generateResponse(finalPrompt);
  console.log("response===>", response);

}

const saveToPinecone = async (fileContent) => {
  try {
    await pinecone.init({
      environment: "us-west4-gcp",
      apiKey: "448fbdce-6cfe-468d-bbd3-d50dfc6a70a7",
    });


    // const { fileContent, language } = cleanFileForPrompt("constants.js");



    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: fileContent,
    });

    const embedding = response.data.data[0].embedding

    const index = pinecone.Index("openai");
    const queryRequest = {
      vector: embedding,
      topK: 10,
      includeValues: true,
      includeMetadata: true,
    };
    const queryResponse = await index.query({ queryRequest });
    console.log("queryResponse===>", queryResponse);

    // const index = await pinecone.createIndex({
    //   createRequest: {
    //     name: "api-test",
    //     dimension: 1536,
    //   },
    // });

    // const index = pinecone.Index("openai");

    // const upsertRequest = {
    //   vectors: [
    //     {
    //       id: "constants.js",
    //       values: embedding,
    //       metadata: {
    //         code: fileContent,
    //       },
    //     }
    //   ]
    // };
    // const upsertResponse = await index.upsert({ upsertRequest });
    // console.log("upsertResponse===>", upsertResponse);

    // pm2.connect(function (err) {
    //   if (err) {
    //     console.error(err);
    //     process.exit(2);
    //   }


    //   pm2.list((err, processDescriptionList) => {
    //     if (err) throw err;

    //     console.log(processDescriptionList);

    //     pm2.disconnect();
    //   });
    //   pm2.start({
    //     script: 'jedi.js', // your script path
    //     name: 'jedi',      // optional name for easier management
    //     exec_mode: 'fork',     // mode to start your application
    //     autorestart: true,     // application will be restarted if crashed
    //     max_memory_restart: '1G' // application will be restarted if it exceeds the max memory
    //   }, function (err, apps) {
    //     pm2.disconnect(); // disconnects from PM2
    //     if (err) throw err
    //   });

    //   pm2.stop("jedi", function(err, apps) {
    //     pm2.disconnect();   // Disconnects from PM2
    //     if (err) throw err
    //   });
    // })
  } catch (error) {
    console.log(error);
  }
}

const puppeteer = require('puppeteer');
// const stealthPlugin = require('puppeteer-extra-plugin-stealth');
// const { Browser } = require('puppeteer');
// const clipboardy = require('clipboardy');
// const { executablePath } = require('puppeteer');
// // const { generateResponse } = require("./utils/api/apiCall");
// const { waitForDebugger } = require('inspector');

//puppeteer.use(stealthPlugin());

const main = async () => {
  let twitterActions;
  let waitTime;

    let browser = await puppeteer.launch();
    //  const browser = await puppeteer.launch({ headless: true, executablePath: executablePath() });
    //  const page = await browser.newPage();
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
    try{
        browser = await puppeteer.launch({
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          userDataDir: '/Users/hari/Library/Application Support/Google/Chrome/Profile 2/Default', // Replace with your actual user data directory path
          slowMo: 1000,
          headless: false,
          defaultViewport: null,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          permissions: ['clipboard-read', 'clipboard-write'],
          ignoreDefaultArgs: ['--enable-automation']
        });
    const page = await browser.newPage();
    await page.goto('https://twitter.com/home');

    await page.waitForTimeout(2000);
    
    const randomScrolls = Math.floor(Math.random() * 10) + 1;
    console.log("randomScrolls===>", randomScrolls)
    // Scroll down three times
    for (let i = 0; i < randomScrolls; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForTimeout(1000); // Wait a bit for new tweets to load
    }


    const tweetsData = await page.evaluate(() => {
      // Get all root tweet elements
      const rootTweetElements = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
  
      // Extract tweet text, URLs, external links and tweet class
      return rootTweetElements.map(rootElement => {
        const tweetTextElement = rootElement.querySelector('div[data-testid="tweetText"]');
        const tweetText = tweetTextElement ? tweetTextElement.textContent : null;
        const tweetClass = tweetTextElement ? tweetTextElement.className : null;
  
        const urlElement = rootElement.querySelector('a[href]');
        const urlIfAny = urlElement ? urlElement.href : null;
  
        const externalLinkElement = rootElement.querySelector('a[href][rel="noopener noreferrer nofollow"]');
        const externalLink = externalLinkElement ? externalLinkElement.href : null;
        if(!tweetText) return null;
        return {
          tweetText,
          tweetClass,
          urlIfAny,
          externalLink
        };
      }).filter(item => item !== null);
    });
  
  
      console.log("tweetsData===>", tweetsData)


    const prompt = `
    Imagine you are a decision maker tasked with deciding whether to respond to a tweet or not.
    Given a list of tweets, select the top tweet that meets the following criteria: 
    - it is cool
    - easy-going
    - fun
    - impactful
    - it wouldn't cause any controversy if responded to with humor. 

    sample Input: [{
      tweetText: "test",
      tweetClass: "test",
      urlIfAny: "test",
      externalLink: "test"
    },{}]

    *actual Tweet is the value of key 'tweetText'.
    
    After you pick the top tweet, generate a reply that meets the following criteria:
    - the maximum character length of reply tweet is 250 characters including the text after #.
    - The tweet should have genuine humor
    - The reply tweet should be positive and thought provoking
    - The reply tweet should be relatable to people


    sample Output: {
      tweetText: "test",
      tweetClass: "test",
      urlIfAny: "test",
      externalLink: "test",
      reply: "test"
    }
    
    Tweets array:
    ${JSON.stringify(tweetsData)}
  `
        
  console.log("----prompt results: ", prompt);

    let chatgptresponse = await generateResponse(prompt, false);


    console.log("----chatgpt results: ", JSON.parse(chatgptresponse).reply);



      
      
    //  reads entire code base 
    //  - 3000 files 
    //   - extract functions 
    //   - dependcy graph for files 
    //   - writes descriptions 
    //   - saves them in to pinecone  

    //   "who price per kwh works ?"
     

    //   list majors keyword of the stack 

    //   "who price per kwh works ?"
    //   givme top 10 words i can search 


      

    //     const inputElement = await page.$('div.public-DraftStyleDefault-block span');
    //     const textToPaste = stripQuotes(chatgptresponse0);
    //     // Simulate the paste operation by injecting JavaScript code
    //     await page.evaluate((element, text) => {
    //         // Create a new event for the paste operation
    //         const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    //           // Set the clipboard data for the paste event
    //         const clipboardData = {
    //             getData: () => text,
    //         };
    //         Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
    //         // Dispatch the paste event on the input element
    //         element.dispatchEvent(pasteEvent);
    //     }, inputElement, textToPaste);
        
    //     console.log("it's pasted");
    //     await page.waitForTimeout(10000);
    //     await page.click('[data-testid="tweetButtonInline"]');
    //     await page.evaluate(() => {
    //         const button = document.querySelector('div[data-testid="tweetButtonInline"]');
    //         button.click();
    //      });
    //     console.log("the tweet button is clicked");
    // }
  
 

    // //reply action
    // async function reply(page, count, waitTime) {
    //     await page.waitForTimeout(waitTime);
    //     for (i = 0; i < count; i++) {
    //         try {
    //             await page.waitForTimeout(2000);
    //             await page.click('svg.r-1nao33i');
    //             await page.reload();
    //             console.log("Tweet ",i+1);
    //             await page.waitForTimeout(2000);
    //             await page.click('.css-1dbjc4n.r-1awozwy.r-onrtq4.r-18kxxzh.r-1b7u577');
  
    //             // Extract the text from the tweet
    //             await page.waitForTimeout(3000);
    //             let textContent = await page.evaluate(() => {
    //                 const div = document.querySelector('div[data-testid="tweetText"]');
    //                 return div.textContent;
    //             });
  
    //             console.log(textContent);
    //             if (textContent.length < 25) {
    //               return
    //             }
    //                 the maximum character length of tweet is 250 characters including the text after #.
    //                 The tweet should be positive and thought provoking, 
    //                 The tweet should be relatable to people, The tweet should have geniune humor, 
    //                 The tweet is 
    //                 : ${textContent}`, false);
    //             console.log("----chatgpt results: ", chatgptresponse);
  
    //             const inputElement = await page.$('div.public-DraftStyleDefault-block span');
    //             const textToPaste = stripQuotes(chatgptresponse);
    //             // Simulate the paste operation by injecting JavaScript code
    //             await page.evaluate((element, text) => {
    //             // Create a new event for the paste operation
    //             const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
  
    //             // Set the clipboard data for the paste event
    //             const clipboardData = {
    //                 getData: () => text,
    //             };
    //             Object.defineProperty(pasteEvent, 'clipboardData', { value: clipboardData });
  
    //             // Dispatch the paste event on the input element
    //             element.dispatchEvent(pasteEvent);
    //             }, inputElement, textToPaste);
    //             console.log("it's pasted");
    //             await page.waitForTimeout(10000);
    //             await page.click('[data-testid="tweetButtonInline"]');
    //             await page.evaluate(() => {
    //             const button = document.querySelector('div[data-testid="tweetButtonInline"]');
    //             button.click();
    //         });
    //         console.log("the tweet button is clicked");
        
    //         } 
    //         catch (error) {
    //             if (error === "Failed to launch the browser process!") {
    //                 console.log("it entered more");
    //                 //await browser.close();
    //                 main();
    //             }
    //             console.error('An error occurred: here', error);
    //             console.log("it entered");
        
    //             console.error('You have clicked while the bot is running. The bot will restart itself in 20 seconds');
    //             await page.waitForTimeout(20000);
    //         }
    //     }
    // }
    
    // async function follow(page) {
    //     //await page.waitForTimeout(2000);
    //     await page.click('svg.r-1nao33i');
    //     await page.reload();
    //     await page.waitForTimeout(2000);
    //     await page.click('div[data-testid="UserCell"]');

    //     await page.waitForTimeout(10000);
    //     await page.click('[data-testid="placementTracking"]');

    //     console.log("clicked");
    //     await page.waitForTimeout(10000);
    // }

    // async function setTwitterAction() {
    //     function getRandomString() {
    //         const options = ['tweet', 'reply']//, 'follow'];
    //         const randomIndex = Math.floor(Math.random() * options.length);
            
    //         return options[randomIndex];            
    //     }

    //     function getRandomMilliseconds() {
    //         // Generate a random number of minutes less than 2
    //         const milliseconds = Math.floor(Math.random() * 120000);
    //         return milliseconds;
    //     }

    //     const randomString = getRandomString();
    //     console.log(randomString);
    //     twitterActions = randomString;
    //     getRandomString();
          
    //     waitTime = getRandomMilliseconds();
    //     minutesTime = Math.ceil(waitTime/60000);
    //     console.log(`Wait time is less than ${minutesTime} Minutes`);

    // }
    // let counter = 0;
    // while(true){
    //     setTwitterAction();
    //     switch (twitterActions) {
    //         case 'tweet':
    //             console.log('Selected Action is tweet.');
    //             await tweet(page, waitTime);
    //             break;
    //         case 'follow':
    //             console.log('Selected Action is follow');
    //             await follow(page, waitTime);
    //             break;
    //         case 'reply':
    //             console.log('Selected Action is reply');
    //             await reply(page, 1, waitTime);
    //             break;
    //         default:
    //         console.log('Selected Action is unknown.');
    //     }
    //     counter = counter + 1;
    //     console.log("the count of actions is: ",counter);
    //     if(counter === 1000){
    //         break;
    //     }
    // }    
    // browser.close();
    // process.exit();
}
catch(error){
    browser.close();
    await delay(5000);
    //main();
    if (error === "Error: Failed to launch the browser process!") {
        await browser.close();
        main();
    }
    console.error('An error occurred in here:', error);
    console.log("browser closed");
}
finally {
    await browser.close();
    if (browser) {
        await browser.close();
    }
}
}
const jedi = async () => {
  
  main();

    // let fileContent = fs.readFileSync('./cli.js', 'utf8');
    // await getComponentsForFile(fileContent)
    //   const isLearningCompleted = await db.get('isLearningCompleted').catch(() => null);
    //   if (!isLearningCompleted) {
    //     console.log("Learning is in progress or not started . ");
    
    //     async function listFilesRecursively() {
    //       const resumeFrom = await db.get('progress').catch(() => null);

    //       if (resumeFrom) {
    //         console.log(`Resuming from file: ${resumeFrom.filePath}`);
    //         await traverseDirectory(resumeFrom.directoryPath, resumeFrom.lastProcessedFile);
    //       } else {
    //         console.log('Starting from the beginning');
    //         await traverseDirectory(directoryPath, null, false);
    //       }

    //       db.put({
    //         _id: 'isLearningCompleted',
    //         status: "completed",
    //         summary: {totalfiles: ""}
    //       })
    //       console.log('Completed');
    //       // process.exit();
    //     }

    //     async function traverseDirectory(directoryPath, resumeFile, isResuming = false) {
    //       const files = await readdir(directoryPath);

    //       let shouldResume = isResuming;
      
    //       for (const file of files) {
    //         const filePath = path.join(directoryPath, file);
    //         const fileStats = await stat(filePath);
    //         if (fileStats.isDirectory()) {
    //           // console.log(file, foldersToIgnore.includes(file));
    //           if (foldersToIgnore.includes(file)) {
    //             continue;
    //           }
    //           await traverseDirectory(filePath, resumeFile, shouldResume); // Recursively call the function for subdirectories
    //         } else {
    //           const fileExtension = path.extname(filePath).toLowerCase();      
    //           if (!fileExtension || fileExtension === '.' || !fileExtension.startsWith('.')) {
    //             continue;
    //           }

    //           if (!shouldResume && resumeFile && filePath !== resumeFile) {
    //             continue; // Skip files until reaching the resume file
    //           }

    //           if (!shouldResume && !resumeFile) {
    //             shouldResume = true; // Set the flag to true if no resume file is specified
    //           }
          

    //           // Ignore files with non-code extensions
    //           if (nonCodeFileExtensions.includes(fileExtension)) {
    //             continue;
    //           }
      
    //           console.log(filePath); // Print the file path

    //           if (!shouldResume) {
    //             shouldResume = true; // Set the flag to true after reaching the resume file
    //             continue; // Skip the resuming file
    //           }

    //           await sleep(2000);

    //           const docId = filePath; // Use the file path as the document ID
    //           let fileContent = fs.readFileSync(filePath, 'utf8');

    //           await tokenizeAndSave(fileContent);

    //           // Check if the document already exists
    //           const existingDoc = await db.get(docId).catch(() => null);

    //           if (existingDoc) {
    //             // Document already exists, handle the conflict according to your requirements
    //             console.log(`Skipping update for existing document: ${docId}`);
    //             continue;
    //           }

    //           const progressDoc = await db.get('progress').catch(() => ({
    //             _id: 'progress',
    //             lastProcessedFile: '', // Initialize lastProcessedFile property
    //           })); // Get the progress document if it exists, or create a new one

    //           progressDoc.directoryPath = directoryPath;
    //           progressDoc.lastProcessedFile = filePath; // Update lastProcessedFile property

    //           await db.put(progressDoc); // Update the progress document in PouchDB

    //           await db.put({
    //             _id: filePath,
    //             directoryPath: directoryPath,
    //             fileName: file,
    //             filePath: filePath,
    //             learning: "done",
    //             gptprocess: "pending",
    //           });
    //         }
    //       }
    //     }

    //     await listFilesRecursively();

    // // // answer questions 

    //   } else {
    //     console.log("Learning is completed. You can start using Jedi now.", isLearningCompleted.summary);
    //     await db.destroy();
    //     // await db.put({
    //     //   _id: 'progress',
    //     //   completed: true,
    //     // });
    //   }
}

welcomeMessage();
// Create REPL instance
const gptCli = repl.start({
  prompt: "gpt-console>",
  useColors: true,
  completer: completerFunc
});  
// Override default evaluator function
gptCli.eval = async (input, context, filename, callback) => {
  if (!input.trim()) { 
    callback(null, );
  }
  const tokens = input.trim().split(" ");
  const command = tokens[0];
  const subcommand = tokens[1];
  switch (command.trim()) {
    case "lint-code":
      validateCommandInputs(tokens, callback);
      await codeLint(tokens[1].trim(), callback);
      break;
    case "optimize-code":
      validateCommandInputs(tokens, callback);
      await codeOptimize(tokens[1].trim(), callback);
      break;
    case "refactor-code":
      validateCommandInputs(tokens, callback);
      await codeRefactor(tokens[1].trim(), callback);
      break;
    case "review-code":
      validateCommandInputs(tokens, callback);
      await codeReview(tokens[1].trim(), callback);
      break;
    case "error-handling":
      validateCommandInputs(tokens, callback);
      await errorHandling(tokens[1].trim(), callback);
      break;
    case "generate-docs":
      validateCommandInputs(tokens, callback);
      await generateDocumentation(tokens[1].trim(), callback);
      break;
    case "unit-tests":
      validateCommandInputs(tokens, callback);
      await generateUnitTests(tokens[1].trim(), callback);
      break;
    case "performance-profiling":
      validateCommandInputs(tokens, callback);
      await performanceProfiling(tokens[1].trim(), callback);
      break;
    case "scan-bugs":
      validateCommandInputs(tokens, callback);
      await scanForBugs(tokens[1].trim(), callback);
      break;
    case "scan-security":
      validateCommandInputs(tokens, callback);
      await scanForSecurity(tokens[1].trim(), callback);
      break;
    case "syscmd":
      executeSystemCommand(input);
      callback(null, );
      break;
    case "help":
      welcomeMessage();
      callback(null, );
      break;
    case "jedi":
      await jedi();
      callback(null, );
      break;
    case "br":
      await browser();
      callback(null, );
      break;
    case 'pixie':
      pixieBot();
      break;
    case 'robocover':
      let botConfig = {
        language: '', // programming language for tests
        testFramework: '', // unit testing framework to be used
        coverageThreshold: 0, // minimum acceptable code coverage percentage
        codePath: '', // location of the codebase for which tests need to be written
        outputPath: '', // where to place the written tests
        exclusionRules: [], // files or directories to exclude from testing
        loggingLevel: '', // detail level for logging (e.g., ERROR, WARNING, INFO, DEBUG)
        notificationSettings: { // settings for progress notifications
            enabled: false,
            frequency: '',
            method: '', // e.g., email, Slack
        },
        autoCommit: { // auto-commit settings
            enabled: false,
            branch: '',
            repository: '',
        },
        buildToolConfigurations: {}, // configurations for integrated build tool
        schedulingSettings: { // scheduling settings for periodic runs
            enabled: false,
            schedule: '',
        }
      };
      switch (subcommand) {
        case 'start':
          console.log('RoboCover bot started...');
          // Add your bot start logic here...
          break;
        case 'stop':
          console.log('RoboCover bot stopped...');
          // Add your bot stop logic here...
          break;
        case 'pause':
          console.log('RoboCover bot paused...');
          // Add your bot pause logic here...
          break;
        case 'resume':
          console.log('RoboCover bot resumed...');
          // Add your bot resume logic here...
          break;
        case 'status':
          console.log('RoboCover bot status...');
          // Add your bot status logic here...
          break;
        case 'logs':
          console.log('RoboCover bot logs...');
          // Add your bot logs logic here...
          break;
        case 'restart':
          console.log('RoboCover bot restarted...');
          // Add your bot restart logic here...
          break;
        case 'update':
          console.log('RoboCover bot updated...');
          // Add your bot update logic here...
          break;
        case 'config':
          console.log('RoboCover bot config...');
          // Add your bot config logic here...
          break;
        case 'help':
          console.log('List of RoboCover bot commands:');
          console.log('  start - Starts the bot');
          console.log('  stop - Stops the bot');
          console.log('  pause - Pauses the bot');
          console.log('  resume - Resumes the bot');
          console.log('  status - Checks the bot status');
          console.log('  logs - Retrieves the bot logs');
          console.log('  restart - Restarts the bot');
          console.log('  update - Updates the bot');
          console.log('  config - Shows the bot configuration');
          // Add your bot help logic here...
          callback(null, );
          break;
        default:
          console.log('Invalid command. Try "help" for a list of available commands.');
          callback(null, );
          break;
      }
      break;
    case "exit":
    case "quit":
    case "q":
    case "\u0003":
        process.exit();
        break;
    default:
      if (!input.trim()) {
        return callback(null, ); 
      }
      if (input.length < 4) { 
        return callback(null, "Please enter atleast 4 characters to get a response"); 
      }
      (async () => {
        await handleDefaultCase(input, callback);
        callback(null, );
      })();
      break;
  }
};
