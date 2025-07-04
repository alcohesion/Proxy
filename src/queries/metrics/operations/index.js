const crud = require('./crud');
const find = require('./find');
const stats = require('./stats');
const remove = require('./remove');

module.exports = Device => {
	return {
		count: stats.count(Device),
		create: crud.create(Device),
		find: find(Device),
		deleteby: remove(Device)
	};
};
