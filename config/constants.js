const customCommands = [
    'lint-code',
    'optimize-code',
    'refactor-code',
    'review-code',
    'error-handling',
    'generate-docs',
    'unit-tests',
    'performance-profiling',
    'scan-bugs',
    'scan-security',
    'syscmd'
];
const codeExtensionsForUnitTesting = ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.cxx', '.cc', '.h', '.hpp', '.cs', '.rb', '.php', '.swift', '.kt', '.go', '.rs', '.scala', '.pl', '.pm', '.sh', '.ps1', '.sql'];

const unitTestingFrameworks = {
    '.js': 'assert',
    '.ts': 'assert',
    '.py': 'pytest',
    '.java': 'JUnit',
    '.c': 'Google Test',
    '.cpp': 'Google Test',
    '.cxx': 'Google Test', 
    '.cc': 'Google Test',
    '.h': 'Google Test',
    '.hpp': 'Google Test',
    '.cs': 'NUnit',
    '.rb': 'RSpec',
    '.php': 'PHPUnit',
    '.swift': 'XCTest',
    '.kt': 'JUnit',
    '.go': 'testing',
    '.rs': 'Rust Test',
    '.scala': 'ScalaTest',
    '.pl': 'Test::More',
    '.pm': 'Test::More',
    '.sh': 'BATS',
    '.ps1': 'Pester',
    '.sql': 'tSQLt',
  };  

module.exports = {
    customCommands,
    codeExtensionsForUnitTesting,
    unitTestingFrameworks
}


