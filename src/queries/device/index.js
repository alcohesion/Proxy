const operations = require('./operations');

module.exports = Device => {
  // Device query operations
  return {
    ...operations(Device)
  };
}
