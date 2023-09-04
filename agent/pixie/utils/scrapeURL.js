const fs = require('fs');
const axios = require('axios');
const marked = require('marked');
const path = require('path');
const puppeteer = require('puppeteer');
const urlModule = require('url');
const { pixieLLM } = require("../../../utils/api/apiCall");
const open = require('open');
const fse = require("fs-extra");

async function downloadMediaFromMarkdown(markdownPath) {
    // Parse markdown file
    const markdown = fs.readFileSync(markdownPath, 'utf-8');
    const tokens = marked.lexer(markdown);

    // Extract URLs
    let urls = [];
    for (let token of tokens) {
        if (token.type === 'paragraph' || token.type === 'text') {
            const matches = token.text.match(/!\[[^\]]*\]\((.*?)\)/g);
            if (matches) {
                for (let match of matches) {
                    const url = match.match(/!\[[^\]]*\]\((.*?)\)/)[1];
                    urls.push(url);
                }
            }
        }
    }

    // Download files
    for (let url of urls) {
        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });
            response.data.pipe(fs.createWriteStream(path.basename(url)));
        } catch (error) {
            console.log(error);
        }
    }
}


let visitedUrls = new Set();
let visitedCount = 0;

const ignoreWords = ['privacy', 'terms', 'about', 'contact', 'login', 'register', 'account', 'faq', 'help', 'forum', 'blog', 'advertise', 'cookie'];

function shouldIgnoreUrl(url) {
    for (let word of ignoreWords) {
        if (url.includes(word)) {
            return true;
        }
    }
    return false;
}


async function extractContent(url) {
  try{

    // Create a new browser instance
    const browser = await puppeteer.launch({ headless: "new" });

    // Create a new page
    const page = await browser.newPage();

    // Recursive function to extract content and follow links
    async function visit(url) {
        let currentUrl = normalizeUrl(url.split('#')[0]);


        if (visitedUrls.has(currentUrl) || visitedCount >= 10) return {};
        
        if (isTrackingUrl(url)) {
            return;
        }

        if (shouldIgnoreUrl(currentUrl)) {
            return;
        }
        
    
        visitedUrls.add(url);
        visitedCount++;

        // Navigate to the URL
        await page.goto(url);

        // Extract the content
        const content = await page.evaluate(() => {
            const elements = Array.from(document.body.getElementsByTagName('*'));
            let text = '';
            let images = new Set();
            let videos = new Set();

            for (const element of elements) {
                if (element.tagName === 'P' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'H4' || element.tagName === 'H5' || element.tagName === 'H6') {
                    text += '\n' + element.innerText;
                } else if (element.tagName === 'IMG' && !element.src.startsWith('data:image')) {
                    images.add(element.src);
                    text += '\n[Image: ' + element.src + ']';
                } else if (element.tagName === 'VIDEO') {
                    videos.add(element.src);
                    text += '\n[Video: ' + element.src + ']';
                }
            }

            const links = Array.from(document.querySelectorAll('a')).map(a => a.href);

            return { text, images: Array.from(images), videos: Array.from(videos), links };
        });

        let data = {};
        data[url] = content;

        // Follow internal links
        for (const link of content.links) {
            if (isInternalLink(link, url)) {
                const subContent = await visit(link);
                data = {...data, ...subContent};
            }
        }

        return data;
    }

    const content = await visit(url);
    await browser.close();

    return content;
  }catch(e) {
    return;
  }
}

function extractURLs(text) {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-zA-Z]{2,})/g;
    let urls = text.match(urlRegex);
    if(urls && urls.length>0){
        // Add https:// before URLs that don't have http:// or https://
    urls = urls.map(url => url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url);

    // Remove duplicates
    urls = [...new Set(urls)];

    return urls;
    }else{
      return []
    }
  
}

async function extractTextAndMetaFromURLForEachSection(url) {
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: "new" });
    // Create a new page
    const page = await browser.newPage();
    // Go to the URL
    await page.goto(url);
    // Extract the text content of the body
    const textContent = await page.evaluate(() => {
        let metaData = '';
        let plainText = '';
        plainText = document.body.innerText
        
        const metaEls = document.querySelectorAll('meta');
        const result = {};

        for (let meta of metaEls) {
            let name = meta.getAttribute('name') || meta.getAttribute('property');
            if (name) {
                result[name] = meta.getAttribute('content');
            }
        }

        metaData = result;
        return {plainText, metaData}
    });
    // Close the browser
    await browser.close();
    if(JSON.stringify(textContent).length > 30000){
        return;
    }

    let sectionWiseMessaging;
    const resp = await pixieLLM(
        `for given below "plainText" and "metaData"
        please extract text for landing page sections
        {header: {title: the tagline or headline, description: descripiton for tagline or headline},
        features: [{name: featurename, title: feature title, descrption: feature descrption}. {}..etc],
        blogs: [{name: blog name, title: blog title, descrption: blog descrption}, {}..etc],,
        teams: [{name: team member name, title: team member role, descrption: team member description}, {}..etc],
        projects: [{name: project name, title: project title, descrption: project description}, {}..etc],
        pricing:[{name: the name of pricing model, price: actual cost of the pricing model , description: description of pricing model, features: features included with thepricing model},{}..etc], 
        testmonials: [{name: the name of the testimonia customer , title: the review title of the testimonia customer , description: full review of the testimonia customer},{}..etc],
        contactus: {email, phone, }}

        if any section not available dont return the key in response
        
        In the response no other text should be there, it must be only JSON. 
        Never skip and return text like // Additional or // Similar entries for others, return full
        Never return output format as  this example: some explationation \`\`\` output, i want pure json 
                
        Request: Response should be able to parse by javascriptfunction JSON.parse(YourResponse)
  
      ${JSON.stringify(textContent)}
          `,
        false
      );  
        try {
          // Try to parse the input directly.
          sectionWiseMessaging = JSON.parse(resp);
        } catch(e) {
          // If that fails, find the first valid JSON string within the input.
          const regex = /```json?([\s\S]*?)```/g;
          const match = regex.exec(resp);
          if(match && match[1]){
            try{
              sectionWiseMessaging = JSON.parse(match[1].trim())
            }catch(e) {
              const resp = await pixieLLM(
                `for given below "plainText" and "metaData"
                please extract text for landing page sections
                {header: {title: the tagline or headline, description: descripiton for tagline or headline},
                features: [{name: featurename, title: feature title, descrption: feature descrption}. {}..etc],
                blogs: [{name: blog name, title: blog title, descrption: blog descrption}, {}..etc],,
                teams: [{name: team member name, title: team member role, descrption: team member description}, {}..etc],
                projects: [{name: project name, title: project title, descrption: project description}, {}..etc],
                pricing:[{name: the name of pricing model, price: actual cost of the pricing model , description: description of pricing model, features: features included with thepricing model},{}..etc], 
                testmonials: [{name: the name of the testimonia customer , title: the review title of the testimonia customer , description: full review of the testimonia customer},{}..etc],
                contactus: {email, phone, }}
                if any section not available dont return the key in response
                
                In the response no other text should be there, it must be only JSON. 
                Never skip and return string like // Additional or // Similar entries for others, return full
                Never return output format as  this example: some explationation \`\`\` output, i want pure json 
                        
                Request: Response should be able to parse by javascriptfunction JSON.parse(YourResponse)


            \`\`\`Input
        
            ${JSON.stringify(textContent)}
                `,
                false
              );
              try{
                sectionWiseMessaging = JSON.parse(resp);  
              }catch(e) {
                sectionWiseMessaging = null;
              }
            }
          }
        }
        if(!sectionWiseMessaging){
          const resp = await pixieLLM(
            `for given below "plainText" and "metaData"
            please extract text for landing page sections
            {header: {title: the tagline or headline, description: descripiton for tagline or headline},
            features: [{name: featurename, title: feature title, descrption: feature descrption}. {}..etc],
            blogs: [{name: blog name, title: blog title, descrption: blog descrption}, {}..etc],,
            teams: [{name: team member name, title: team member role, descrption: team member description}, {}..etc],
            projects: [{name: project name, title: project title, descrption: project description}, {}..etc],
            pricing:[{name: the name of pricing model, price: actual cost of the pricing model , description: description of pricing model, features: features included with thepricing model},{}..etc], 
            testmonials: [{name: the name of the testimonia customer , title: the review title of the testimonia customer , description: full review of the testimonia customer},{}..etc],
            contactus: {email, phone, }}
            if any section not available dont return the key in response
            
            In the response no other text should be there, it must be only JSON. 
            Never skip and return string like // Additional or // Similar entries for others, return full
            Never return output format as  this example: some explationation \`\`\` output, i want pure json 
                    
            Request: Response should be able to parse by javascriptfunction JSON.parse(YourResponse)
                    

            \`\`\`Input
        
            ${JSON.stringify(textContent)}
                `,
            false
          );
        
          try {
            // Try to parse the input directly.
            sectionWiseMessaging = JSON.parse(resp);
          } catch(e) {
            return;
          }
  
        }
        if(!sectionWiseMessaging){
          return;
        }

    return sectionWiseMessaging;
}


function normalizeUrl(url) {
    // Remove trailing slash if it exists
    return url.endsWith('/') ? url.slice(0, -1) : url;
}
function isTrackingUrl(url, lengthThreshold = 100, paramThreshold = 3) {
    // Length condition
    if (url.length > lengthThreshold) {
        return true;
    }

    // Readability condition (a basic check for encoded strings)
    if (/%[0-9A-Fa-f]{2}/i.test(url)) {
        return true;
    }

    // Parameters condition
    let parameters = url.split('?').pop().split('&');
    if (parameters.length > paramThreshold) {
        return true;
    }

    // If none of the conditions is met, it's not a tracking URL
    return false;
}

// Check if a link is internal
function isInternalLink(link, baseUrl) {
    if (link.startsWith('http://') || link.startsWith('https://')) {
        const baseDomain = urlModule.parse(baseUrl).hostname;
        const linkDomain = urlModule.parse(link).hostname;
        return baseDomain === linkDomain;
    } else {
        return link.startsWith('/');
    }
}
async function downloadFromWebURL(url) {
    const content = await extractContent(url);
    if(!content){
      return;
    }
    const scarappedURL = Object.keys(content);
    let finalTextOnlyContent = ""
    for (let i = 0; i < scarappedURL.length; i++) {
        const url = scarappedURL[i];
        finalTextOnlyContent = `${finalTextOnlyContent} \n ${url}:${content[url].text}`;
    }
    return finalTextOnlyContent;
}

function getImageUrls(str) {
    let matches = str.match(/\[Image: (.*?)\]/g);
    return matches ? matches.map(match => match.replace('[Image: ', '').replace(']', '')) : [];
}
// function getImageUrls(str) {
//     let regex = /\[Image: (.*?)\]/g;
//     let match;
//     let urls = [];
//     while ((match = regex.exec(str)) != null) {
//         // this splits the URL on '/' and then joins back only the parts till the '.png' 
//         let urlParts = match[1].split('/');
//         let baseUrl = urlParts.slice(0, urlParts.findIndex(part => part.includes('.png')) + 1).join('/');
//         urls.push(baseUrl);
//     }
//     return urls;
// }

function renderContent(content) {
    let imageUrls = getImageUrls(content);
    imageUrls.forEach(imageUrl => {
        content = content.replace(`[Image: ${imageUrl}]`, `<img src="${imageUrl}" alt="content image" />`);
    });
    return `<p>${content}</p>`;
}


// let jsonData = {
//   "Overview": {
//     "Introduction": "Technology that makes it easy to develop last mile logistics apps, mainly focused on end-user experience.",
//     "Focus": "Onroad will take care of the rest of the hard stuff — Collecting user live location, Sending live tracking URL to end user, Geofencing, Geotagging, Webhooks to update location tracking data to your database.",
//     "Mission": "The aim of the platform is to use best-of-breed technology to collect user location data and feed into your database. So that inhouse developers focus on features that are important for the business."
//   },
//   "Features": {
//     "Location Live Tracking": "[Image: https://static.wixstatic.com/media/358fdc_2a10c573091448cda07ded9ab6f15867~mv2.gif] End customer experience is key to last mile logistics success. We provide you with highly customizable template that you can design based on your business needs.",
//     "On-Demand Route Optimization": "[Image: https://static.wixstatic.com/media/358fdc_0122c095784e41daaf12e3886631f66e~mv2.gif] New order/pickup/job/service-trip is a distraction for on field workers. If a new task comes in, the existing navigation plan automatically readjusted based on the new task.",
//     "Geofence and Geotagging": "[Image: https://static.wixstatic.com/media/358fdc_789ea74f207046949438bbcae02de794~mv2.gif] For every new task we automatically create a geotag for that location. We provide you monitoring metrics like delays, on time visits, total visits, route validation, completion time, service time, idle time, uploaded data with latlng tagged with it for proof.",
//     "Schedule Jobs to Nearby Workers": "[Image: https://static.wixstatic.com/media/c837a6_1f658b7b98b846d4865a783d52c8b43c~mv2.jpg/v1/fill/w_57,h_74,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_auto/Artboard%2048%20copy%206_5x-100.jpg] For every new order/pickup/job/service-trip you can find drivers closest to the destination.",
//     "End User Experience": "Actual URL that end user receives when delivery or trip start: Deliver exceptional customer experience in last mile logistics. Meet your customers expectations. They are expecting full visibility of their orders through planning, scheduling, tracking, and fulfillment. Also, they should be able to adjust the location pin if they changed the destination address. They should be able to tip, review, and chat with drivers."
//   },
//   "Pricing": {
//     "Pricing Options": "[Image: https://static.wixstatic.com/media/358fdc_60e88105042745159b44fa7c3da9fae4~mv2.png/v1/fill/w_112,h_150,al_c,q_85,usm_0.66_1.00_0.01,blur_2,enc_auto/Onroad-pricing.png] We are offering free integration and support for premium plan."
//   },
//   "About Us": {
//     "Who We Are": "Make your logistics tech resilient, sustainable, and transformative while improving customer experience. Trusted Among Industry Leaders.",
//     "Our Clients": "[Image: https://static.wixstatic.com/media/358fdc_909faba385cd480485db24598892d94c~mv2.png/v1/fill/w_89,h_56,al_c,q_85,usm_0.66_1.00_0.01,blur_3,enc_auto/frontheheart.png] thisd fasf asdfa dfad fadf adsf[Image: https://static.wixstatic.com/media/358fdc_0b1ac95157524c6c80e0b25a930b50eb~mv2.png/v1/fill/w_149,h_58,al_c,q_85,usm_0.66_1.00_0.01,blur_3,enc_auto/zerone.png]",
//     "Achievements": "100+ Logistic Tech builders. 1M+ Location events processed."
//   },
//   "Contact": {
//     "Address": "3001 Bishop Dr, San Ramon, CA 94583",
//     "Customer Care": "help@onroad.app",
//     "Sales": "sales@onroad.app"
//   }
// }
async function buildHTMLDocumentationFile(jsonData, projectName, url) {
   
    let navHtml = '';
    let contentHtml = '';
    for (let mainKey in jsonData) {
        let mainContent = jsonData[mainKey];
        let mainKeyFormatted = mainKey.toLowerCase().replace(/ /g, '-');
    
        navHtml += `<li class="nav-item section-title"><a class="nav-link scrollto" href="#${mainKeyFormatted}">${mainKey}</a><ul class="nav flex-column mt-2 lvl2">`;
    
        contentHtml += `<article class="docs-article" id="${mainKeyFormatted}"><header class="docs-header"><h1 class="docs-heading">${mainKey}</h1>`;
    
        if (typeof mainContent === 'string') {
            contentHtml += `<section class="docs-intro">${renderContent(mainContent)}</section></header>`;
        } else {
            contentHtml += '</header>';
    
            for (let subKey in mainContent) {
                let subContent = mainContent[subKey];
                let subKeyFormatted = subKey.toLowerCase().replace(/ /g, '-');
    
                navHtml += `<li class="nav-item"><a class="nav-link scrollto" href="#${subKeyFormatted}">${subKey}</a></li>`;
    
                contentHtml += `<section class="docs-section" id="${subKeyFormatted}"><h2 class="section-heading">${subKey}</h2>${renderContent(subContent)}</section>`;
            }
        }
    
        navHtml += '</ul></li>';
        contentHtml += '</article>';
    }
    
    
    let html = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <title>${projectName}</title>

      <!-- Meta -->
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <link rel="shortcut icon" href="">

      <!-- Google Font -->
      <link href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700&display=swap" rel="stylesheet">

      <link rel="stylesheet" type="text/css" href="https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fdoc%2Fdocss.css?alt=media&token=2acf8867-bf7c-4585-a178-4360c83c117f">
    </head>

    <body class="docs-page" data-bs-spy="scroll" data-bs-target="#docs-nav" data-bs-root-margin="-100px 0px -40%">
      <header class="header fixed-top">
        <div class="branding docs-branding">
          <div class="container-fluid position-relative py-2">
            <div class="docs-logo-wrapper gap-2 d-flex">
              <button id="docs-sidebar-toggler" class="docs-sidebar-toggler docs-sidebar-visible d-xl-none" type="button">
                <span></span>
                <span></span>
                <span></span>
              </button>
              <div class="site-logo">
                <a class="navbar-brand" href="${url}">
                  <span class="logo-text">${projectName } &nbsp; <span class="text-alt">Doc</span></span>
                </a>
              </div>
            </div>
            
            <div class="docs-top-utilities d-flex justify-content-end align-items-center gap-3">
              <div class="top-search-box d-none d-lg-flex">
                <form class="search-form">
                  <input type="search" placeholder="Search the docs..." name="search" class="form-control search-input" autocomplete="off">
                  <div id="results"></div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="docs-wrapper">
        <div id="docs-sidebar" class="docs-sidebar">
          <div class="top-search-box d-lg-none p-3">
            <form class="search-form">
              <input type="text" placeholder="Search the docs..." name="search" class="form-control search-input">
              <button type="submit" class="btn search-btn" value="Search">
                <i class="fas fa-search"></i>
              </button>
            </form>
          </div>
          <nav id="docs-nav" class="docs-nav navbar">
            <ul class="section-items list-unstyled nav flex-column pb-3">
                ${navHtml}
            </ul>
          </nav>
        </div>


        <div class="docs-content">
          <div class="container">
            ${contentHtml}
            </article>
          </div>
        </div>
      </div>

      <script src="https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fdoc%2Fdoc.js?alt=media&token=e14d2005-8114-4250-b4f3-7339cc3cfae3"></script>

    </body>

    </html>
    `;
    
    // fs.writeFileSync('output.html', html);

    try {
      const destinationPath = "yourproject/documentation.html";
      await fse.ensureDir(path.dirname(destinationPath));
      fs.writeFileSync(
        destinationPath,
         html,
        "utf8"
      );
      open(destinationPath)
      return;
    } catch (err) {
      return;
      // console.error(err);
    }
}

async function formatContextFromRawData(rawData) {
  let formatContextFromRawData;
  const prompt =  `For given raw text from website: ${rawData},
  Please organize above raw text from a website into below format for building documentation.
  If possible, please expand the sections and add more details and make it SEO friendly.

  {
    "Overview": {
      "Introduction": "[Image: image link if any] title",
      "Focus": "[Image: image link if any] Focus"
      "Mission":"[Image: image link if any] Focus"
      ...etc
    },
    "Features": {
      "Features1": "[Image: image link if any] Features1 description",
      "Features2": "[Image: image link if any] Features2 description",
      ...etc
    },
    "Pricing": {
      "Pricing Options": "[Image: image link if any] pricing options description"
      ...etc
    },
    "About Us": {
      "Who We Are": "[Image: image link if any] who we are description",
      "Our Clients": "[Image: image link if any] our clients description",
      "Achievements": "[Image: image link if any] achievements description",
      ...etc
    },
    "Contact": {
      "Address": "[Image: image link if any] address description",
      "Customer Care": "help@onroad.app",
      "Sales": "sales@onroad.app"
      ...etc
    }
    ...etc(other sections if any)
  }

  In the response no other text should be there, it must be only JSON. No explanation is required in the response. 
  Never skip and return text like // Additional or // Similar entries for others, return full
  Never return output format as  this example: some explationation \`\`\` output, i want pure json 
          
  Request: Response should be able to parse by javascriptfunction JSON.parse(YourResponse)
    `
  const resp = await pixieLLM(prompt,false);  
    // console.log("---1----", resp);
      try {
        // Try to parse the input directly.
        formatContextFromRawData = JSON.parse(resp);
      } catch(e) {
        // If that fails, find the first valid JSON string within the input.
        const resp2 = await pixieLLM(prompt,false);  

       //  console.log("---resp2----", resp2);
        try {
          // Try to parse the input directly.
          formatContextFromRawData = JSON.parse(resp2);
        } catch(e) {
           // If that fails, find the first valid JSON string within the input.
          const resp3 = await pixieLLM(prompt,false);  

          //console.log("---resp3----", resp3);
          try {
            // Try to parse the input directly.
            formatContextFromRawData = JSON.parse(resp3);
          } catch(e) {
            return;
            
          }
          
        }
        
      }

   if(!formatContextFromRawData){
      return;
   }
  return formatContextFromRawData;
}

module.exports = {
    downloadMediaFromMarkdown,
    downloadFromWebURL,
    buildHTMLDocumentationFile,
    extractTextAndMetaFromURLForEachSection,
    extractURLs,
    formatContextFromRawData
};



//messaging from site 
//documentation form site
//messagin from readme

