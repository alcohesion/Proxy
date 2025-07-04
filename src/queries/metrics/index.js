const operations = require('./operations');

module.exports = Metrics => {
  // Metrics query operations
  return {
    ...operations(Metrics)
  };
}
