const { exec } = require("child_process");

function executeSystemCommand(input) {
    if (!input || !input.trim()) {
      callback(new Error("Command missing. Usage: syscmd <system command>"));
      return;
    }
    const sytemcommand = input.replace('syscmd', "").trim();
    
    return exec(sytemcommand, (error, stdout, stderr) => {
      if (error) {
        console.log(new Error(`Error executing ${sytemcommand}: ${stderr}`));
        return;
      }
      process.stdout.write("\n");
      process.stdout.write(stdout);
      process.stdout.write("\n");
    });
}

module.exports = {
    executeSystemCommand
}