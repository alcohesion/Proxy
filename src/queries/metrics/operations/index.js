const crud = require('./crud');
const find = require('./find');
const stats = require('./stats');
const remove = require('./remove');

module.exports = (Metrics, log) => {
	return {
		stats: stats(Metrics, log),
		crud: crud(Metrics, log),
		find: find(Metrics, log),
		remove: remove(Metrics, log)
	};
};
