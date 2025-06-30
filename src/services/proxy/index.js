const handlers = require('./handlers');

module.exports = (app, api) => {
	// Only WebSocket proxy is used, no HTTP endpoints needed
};

// Export handlers for use by WebSocket endpoints
module.exports.handlers = handlers;
