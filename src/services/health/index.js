const { status } = require('./handlers');

module.exports = (app, api) => {
	status(app, api);
}
