#!/usr/bin/env node

const repl = require("repl");

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
    case "exit":
    case "quit":
    case "q":
    case "\u0003":
        process.exit();
        break;
    default:
      (async () => {
        await handleDefaultCase(input, callback);
        callback(null, );
      })();
      break;
  }
};


