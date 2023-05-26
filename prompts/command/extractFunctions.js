const EXTRACT_FUNCTIONS = (programmingLanguage) => `Extract functions and code blocks from a ${programmingLanguage} code file. The task involves extracting functions and their corresponding code blocks that meet the following requirements:
1. Remove all comments from the code.
2. Extract each function found in the code file along with its associated code block.
3. Build an Abstract Syntax Tree (AST) for each function.
4. Return the result in JSON format with the following keys: 'functionname', 'codeblock', and 'AST'.
5. Please provide the response in JSON format only, without any additional text.
Code:\n`;

module.exports = {
    EXTRACT_FUNCTIONS,
}