const proxy = require('./proxy');
const metrics = require('./metrics');
const health = require('./health');
const queries = require('../queries');
const log = require('../logging');
const { proxy: proxyConfig } = require('../configs');

// export all services
module.exports = (app, proxyWs) => {
	proxy(app, queries, log, proxyConfig, proxyWs);
	metrics(app, queries, log);
	health(app, queries, log);
}
