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
const codeExtensionsForUnitTesting = [
    '.js', '.ts', '.py', '.java', '.c', '.cpp', '.cxx', '.cc', '.h', '.hpp',
    '.cs', '.rb', '.php', '.swift', '.kt', '.go', '.rs', '.scala', '.pl', '.pm',
    '.sh', '.ps1', '.sql', '.json', '.xml', '.yaml', '.yml', '.md', '.bat', '.cmd',
    '.ps1', '.m', '.r', '.lua', '.dart', '.groovy', '.hs', '.jl', '.m', '.vb', '.pl',
    '.pm', '.sh'
];

module.exports = {
    customCommands,
    codeExtensionsForUnitTesting
}


