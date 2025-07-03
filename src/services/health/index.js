const { status } = require('./handlers');

module.exports = app => {
	status(app);
}
