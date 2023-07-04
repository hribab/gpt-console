function findElementFromObj(obj, key) {
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      if (prop === key) {
        return obj[prop];
      } else if (typeof obj[prop] === 'object') {
        const result = findElementFromObj(obj[prop], key);
        if (result) {
          return result;
        }
      }
    }
  }
  return undefined;
}

module.exports = {
  findElementFromObj
}
