const operations = require('./operations');

module.exports = (Device, log) => {
  // Device query operations
  return {
    ...operations(Device, log)
  };
}
