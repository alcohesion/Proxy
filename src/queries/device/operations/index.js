const crud = require('./crud');
const find = require('./find');
const stats = require('./stats');

module.exports = (Device, log) => {
	return {
		stats: stats(Device, log),
		crud: crud(Device, log),
		find: find(Device, log)
	};
};
