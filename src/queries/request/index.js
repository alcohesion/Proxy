const operations = require('./operations');

module.exports = Request => {
  // Request query operations
  return {
    ...operations(Request)
  };
}
