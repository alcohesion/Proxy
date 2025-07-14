const proxyHandler = require('./handlers');

module.exports = (app, queries, log, handler, settings, wss) => {
	// Initialize proxy request handler
	new proxyHandler(app, queries, log, handler, settings, wss);
};
