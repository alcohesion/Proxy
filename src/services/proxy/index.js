const handlers = require('./handlers');

module.exports = (app, queries, log, proxyConfig, proxyWs) => {
	// Initialize proxy request handler
	handlers(app, queries, log, proxyConfig, proxyWs);
};
