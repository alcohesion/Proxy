const proxy = require('./proxy');
const metrics = require('./metrics');
const health = require('./health');
const queries = require('../queries');
const log = require('../logging');
const { proxy: handler } = require('../handlers');
const { ProxyWebSocket } = require('../wss');

// export all services
module.exports = (app, settings) => {
	proxy(app, queries, log, handler, settings, ProxyWebSocket);
	metrics(app, queries, log, settings);
	health(app, queries, log);
}
