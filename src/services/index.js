const proxy = require('./proxy');
const metrics = require('./metrics');
const health = require('./health');
const queries = require('../queries');
const log = require('../logging');
const { proxy: proxyConfig } = require('../configs');

// export all services
module.exports = (app, client) => {
	proxy(app, client, queries, log, proxyConfig);
	metrics(app, queries, log);
	health(app, queries, log);
}
