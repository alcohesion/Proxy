const { log, setMonitorServer } = require('./log');
const web = require('./web');

module.exports = {
  log: { log, setMonitorServer },
  web
};
