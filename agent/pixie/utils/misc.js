// function extractCode(input) {
//   const regex = /```(javascript|jsx)?([\s\S]*?)```/g;
//   const match = regex.exec(input);
//   return match ? match[2].trim() : null;
// }

// gtpCode = extractCode(resp);

// function mergeCodes(originalCode, aiModelCode) {
//   // Split the codes into arrays of lines
//   const originalLines = originalCode.split("\n");
//   const modelLines = aiModelCode.split("\n");

//   // Initialize an empty array to hold the merged code
//   const mergedLines = [];

//   // Flag to keep track of whether we are in a section to be replaced
//   let replaceSection = false;
//   let replaceStartLine;

//   // Loop through each line in the AI model code
//   for (let i = 0; i < modelLines.length; i++) {
//     if (modelLines[i].trim() === '// ...rest of the code') {
//       // If we encounter the placeholder text, set the flag and remember the start line
//       replaceSection = true;
//       replaceStartLine = i;
//     } else if (replaceSection) {
//       // If we are in a section to be replaced, look for the corresponding lines in the original code
//       const modelLine = modelLines[i].trim();
//       const originalIndex = originalLines.findIndex(line => line.trim() === modelLine);

//       if (originalIndex !== -1) {
//         // If the line is found in the original code, add all lines from the original code between the start and end
//         const originalSection = originalLines.slice(replaceStartLine, originalIndex);
//         mergedLines.push(...originalSection);

//         // Stop replacing the section
//         replaceSection = false;
//       }
//     } else {
//       // If we are not in a section to be replaced, just add the line from the model code
//       mergedLines.push(modelLines[i]);
//     }
//   }

//   // Join the lines back together into a single string
//   const mergedCode = mergedLines.join("\n");
//   return mergedCode;
// }

// finalCode = mergeCodes(code, gtpCode);

// // console.log("====gtpCode====", finalCode);





// ---------generateMessaging---------------
// async function generateMessaging(userRequirement, filePath) {

//     let code, gtpCode, finalCode;
//     try {
//       code = fs.readFileSync(
//         filePath,
//         "utf8"
//       );
//       gtpCode = code;
//     } catch (err) {
//       console.error(err);
//     }
    
    
//     const updates = [
//       {
//         line: 18,
//         originaltext: 'Paper Kit 2 PRO',
//         updatedtext: 'Your AI Partner for Custom LLM'
//       },
//       {
//         line: 21,
//         originaltext: "Now you have no excuses, it's time to surprise your clients, your competitors, and why not, the world. You probably won't have a better chance to show off all your potential if it's not by designing a website for your own agency or web studio.",
//         updatedtext: 'We build AI solutions for startups to help achieve a customized Legaltech by leveraging advanced Machine Learning Models.'
//       },
//       {
//         line: 53,
//         originaltext: 'Awesome Experiences',
//         updatedtext: 'Delivering Tailored AI Solutions'
//       },
//       {
//         line: 56,
//         originaltext: "Now you have no excuses, it's time to surprise your clients, your competitors, and why not, the world. You probably won't have a better chance to show off all your potential if it's not by designing a website for your own agency or web studio.",
//         updatedtext: 'We cater to AI startups, providing tailored solutions to streamline your business operations and enhance efficiency by leveraging advanced Machine Learning Models'
//       },
//       {
//         line: 87,
//         originaltext: 'Premium Offers for Venice',
//         updatedtext: 'Join the AI Revolution with Us'
//       },
//       {
//         line: 90,
//         originaltext: "Now you have no excuses, it's time to surprise your clients, your competitors, and why not, the world. You probably won't have a better chance to show off all your potential if it's not by designing a website for your own agency or web studio.",
//         updatedtext: 'We specialize in providing AI-driven solutions for startups, focusing on creating custom Legaltech by leveraging our expertise in Machine Learning Models.'
//       },
//       {
//         line: 132,
//         originaltext: 'Creative Tim',
//         updatedtext: 'Your AI Startup Solution Provider'
//       }
//     ];
    
    
//     const ast = parser.parse(code, {sourceType: "module", plugins: ["jsx"]});
    
//     let currentLineNumber = 1;
//     traverse(ast, {
//         enter(path) {
//             if(path.node.loc) {
//                 currentLineNumber = path.node.loc.start.line;
//             }
    
//             if (
//                 t.isJSXText(path.node)
//             ) {
//                 const lineUpdate = updates.find(u => u.originaltext.toLowerCase() === path.node.value.trim().toLowerCase());
//                 if(lineUpdate) {
//                   path.node.value = path.node.value.replace(lineUpdate.originaltext, lineUpdate.updatedtext);
//                 }
//             }
//         },
//     });
    
//     const { code: newCode } = generator(ast);
//     // console.log("------", newCode);
    
    
    
//     let ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] });
    
//     for (let update of updates) {
//       traverse(ast, {
//           enter(path) {
            
//             if (path.node.arguments.length > 0){
//               // console.log("====value===", path.node.arguments[0].value, path.node);
//             }
            
    
//             // path.node.arguments.length > 0
//               // if (
//               //     path.node.type === 'JSXText' &&
//               //     path.node.value.includes(update.originaltext) &&
//               //     path.node.loc.start.line <= update.line &&
//               //     update.line <= path.node.loc.end.line
//               // ) {
//               //     path.node.value = path.node.value.replace(update.originaltext, update.updatedtext);
//               // }
//           },
//       });
//     }
    
//     let newCode = generate(ast, { retainLines: true }).code;
    
//     // console.log("=======newcode====", newCode);
    
//     // Split the code into lines
//     let lines = gtpCode.split('\n');
    
//     // Sort updates in descending order by line number
//     // This is important because when we replace a piece of text, the line numbers of all text after it will potentially change.
//     // updates.sort((a, b) => b.line - a.line);
    
//     // Iterate over each update object in your updates array using a for loop
//     for (let j = 0; j < updates.length; j++) {
//       let update = updates[j];
//       let regex = new RegExp(update.originaltext, 'g');
      
//       // Start searching from the specified line
//       for (let i = update.line; i < lines.length; i++) {
//         // console.log("==>",i,  "--code--", lines[i], "---gptrepso===", update.originaltext);
//         if (regex.test(lines[i])) {
//           // console.log("Found match in line", i, lines[i]);
//           // Replace the text and reassign the modified line back to the array
//           lines[i] = lines[i].replace(regex, update.updatedtext);
//           break; // break after replacing in the first matching line
//         }
//       }
//     }
    
//     // Join the lines back into a single string
//     let updatedCode = lines.join("\n");
    
    
//     Reassemble the code
//     // console.log("=-===nainal code===", updatedCode);
    
//     const resp = await generateResponse(
//       `
//       Given the User Requirement: “ ${userRequirement} “, modify the provided JSX code to update the messaging according to the following criteria:
    
//     1. The messaging should follow the customer value proposition format: "We build [software/product/service] for [ICP] to help achieve [RESULT] by leveraging [DIFFERENTIATION]." 
//     2. Predict the most suitable initial customer profile (ICP) based on the user requirement.
//     3. Predict the most suitable RESULT or outcome based on the user requirement.
//     4. Predict the most suitable technology or tool(DIFFERENTIATION) that would be used to build the product based on the user requirements.
//     5. The messaging should be SEO-friendly.
    
//     Output should be json object with the following format:
//     [{"line": The line number on the code that got updated, "originaltext": the original text as it is, dont include any html tags, "updatedtext": update text based on user requirement and SEO friendly},{},{}]
    
//     In the response no other text should be there, it must be only JSON. 
    
//     Request: Response should be able to parse by javascriptfunction JSON.parse(YourResponse)
    
//     Here is the JSX code to modify:
    
//     \`\`\`jsx
    
//     ${code}
//         `,
//       false
//     );
    
    
    
//     // console.log("====resp====", resp);
    
//     let actualJson;
//       try {
//         // Try to parse the input directly.
//         actualJson = JSON.parse(resp);
//       } catch(e) {
//         // If that fails, find the first valid JSON string within the input.
//         const regex = /```json?([\s\S]*?)```/g;
//         const match = regex.exec(resp);
//         actualJson = match ? JSON.parse(match[1].trim()) : null;
//       }
    
//       // console.log("====resp====", actualJson);
    
    
//     for (const update of actualJson) {
//       // console.log("====update====", update);
    
//         // Replace all instances of 'originaltext' with 'updatedtext' in the JS code
//         gtpCode = gtpCode.split(update.originaltext).join(update.updatedtext);
//     }
//       // console.log("====gtpCode====", gtpCode);
    
//     let ast;
//     try {
//       ast = parser.parse(gtpCode, {
//         sourceType: "module",
//         plugins: ["jsx"],
//       });
//     } catch (error) {
//       // console.log("it's parse catch");
//       console.error("Syntax error:", error.message, error.stack);
//       // const resp = await generateResponse(`There is a syntax error in the below javascript code. Please correct the syntax errors only.
//       // response should has only the code, nothing else should be there in response
//       // error: ${error.message}
//       // stacktrace : ${error.stack.split('\n')[0]}
//       // code: ${code}
//       // `, false)
    
//       // // console.log("----res[====", resp)
//       // ast = parser.parse(resp, {
//       //   sourceType: "module",
//       //   plugins: ["jsx"],
//       // });
//       console.error("Major part of stack trace:", error.stack.split("\n")[0]);
//     }
    
//     let output;
//     try {
//       output = generate(ast).code;
//       // console.log("==syntax checked==cahtgptcode====", output);
    
//       try {
//         fs.writeFileSync(
//           filePath,
//           output,
//           "utf8"
//         );
//         // console.log("File successfully written!");
//       } catch (err) {
//         console.error(err);
//       }
//     } catch (error) {
//       // console.log("it's catch");
//       console.error("Syntax error:", error.message);
//       console.error("Stack trace:", error.stack);
//     }
    
//     }
    