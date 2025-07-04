const operations = require('./operations');

module.exports = (Metrics, log) => {
  // Metrics query operations
  return {
    ...operations(Metrics, log)
  };
}
