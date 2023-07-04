const decompress = require("decompress");

function decompressFile(file, dir) {
  decompress("example.zip", "dist")
  .then((files) => {
    console.log(files);
  })
  .catch((error) => {
    console.log(error);
  });
};



module.exports = {
  decompressFile
}
