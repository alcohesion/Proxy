const handlers = require('./handlers');

module.exports = (app, client, queries, log, proxyConfig) => {
	// Initialize proxy request handler
	handlers(app, client, queries, log, proxyConfig);
};
