const crud = require('./crud');
const find = require('./find');
const stats = require('./stats');
const remove = require('./remove');

module.exports = Request => {
	// Request query operations
	return {
		count: stats.count(Request),
		create: crud.create(Request),
		find: find(Request),
		deleteby: remove(Request)
	};
}
