const handlers = require('./handlers');

module.exports = (app, api) => {
	// Initialize proxy request handler
	handlers.request(app, api);
};

// Export handlers for use by WebSocket endpoints
module.exports.handlers = handlers;
