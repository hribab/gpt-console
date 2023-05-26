const recast = require('recast');
const traverse = require('@babel/traverse').default;

function removeComments(fileContent) {
    // Remove the shebang line if present
    const cleanFileContent = fileContent.replace(/^#!.*/, '');
    
    // Parse the code into an AST
    const ast = recast.parse(cleanFileContent);
    
    // Visitor to remove comments and stale code
    const visitor = {
      visitNode(path) {
        // Remove single-line comments
        if (path.node.comments && path.node.comments.length > 0) {
          path.node.comments = path.node.comments.filter(comment => comment.type !== 'Line');
        }
        this.traverse(path);
      },
      visitBlock(path) {
        // Remove block comments
        path.replace();
        this.traverse(path);
      },
      visitEmptyStatement(path) {
        // Remove empty statements
        path.prune();
        return false;
      },
      visitProgram(path) {
        // Remove end-of-file comments
        if (path.node.comments) {
          path.node.comments = path.node.comments.filter(comment => !comment.trailing);
        }
    
        const body = path.get('body');
        if (body && body.length > 0) {
          // Find the last index of `ExpressionStatement`
          let lastIndex = -1;
          for (let i = body.length - 1; i >= 0; i--) {
            const node = body[i];
            if (node.type === 'ExpressionStatement') {
              lastIndex = i;
              break;
            }
          }
    
          if (lastIndex !== -1) {
            // Remove all nodes after the last `ExpressionStatement`
            path.node.body = path.node.body.slice(0, lastIndex + 1);
          }
        }
    
        if (path.node.comments && path.node.comments.length > 0) {
          // Remove top-level comments
          path.node.comments = [];
        }
    
        this.traverse(path);    
      },
      // Add more conditions for removing other types of stale code
    };
    
    
    // Apply the visitor to remove comments and stale code
    recast.visit(ast, visitor);
    
    // Generate the modified code
    const modifiedCode = recast.print(ast).code;
    // remove outside code comments
    const finalCode = modifiedCode.replace(/(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)|(\/\/.*)/g, '')
    return finalCode

}

module.exports = {
    removeComments
}
