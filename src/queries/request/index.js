const operations = require('./operations');

module.exports = (Request, log) => {
  // Request query operations
  return {
    ...operations(Request, log)
  };
}
