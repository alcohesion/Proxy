const create = require('./create');
const find = require('./find');
const count = require('./count');
const update = require('./update');

module.exports = {
	...create,
	...find,
	...count,
	...update
};
