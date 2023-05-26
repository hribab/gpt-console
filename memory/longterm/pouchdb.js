// Function 1
function func1() {
    return "Function 1 called";
  }
  
  // Function 2
  function func2() {
    console.log("Function 2 called");
  }
  
  // Export the functions
  module.exports = {
    func1,
    func2
  };

  // const db = new PouchDB('mydb', { adapter: 'memory' });

// db.put({
//   _id: 'mydoc',
//   title: 'Heroes'
// }).then(function (response) {
//   // handle response
//   console.log("---------------",response);
// }).catch(function (err) {
//   console.log(err);
// });