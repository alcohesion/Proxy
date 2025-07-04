const crud = require('./crud');
const find = require('./find');
const stats = require('./stats');
const remove = require('./remove');

module.exports = (Request, log) => {
	// Request query operations
	return {
		stats: stats(Request, log),
		crud: crud(Request, log),
		find: find(Request, log),
		remove: remove(Request, log)
	};
}
