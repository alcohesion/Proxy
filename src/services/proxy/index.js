const handlers = require('./handlers');

module.exports = (app, client) => {
	// Initialize proxy request handler
	handlers(app, client);
};
