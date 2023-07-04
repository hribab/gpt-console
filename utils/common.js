function findElementFromObj(obj, key) {
  const found = Object.entries(obj).find(([prop, value]) => {
    if (prop === key) {
      return true;
    } else if (typeof value === 'object') {
      return findNestedElement(value, key);
    }
  });
  return found ? found[1] : undefined;
}


module.exports = {
  findElementFromObj
}
