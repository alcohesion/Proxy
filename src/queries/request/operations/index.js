const create = require('./create');
const findbyhex = require('./findbyhex');
const findmany = require('./findmany');
const count = require('./count');
const aggregate = require('./aggregate');
const deletebyhex = require('./deletebyhex');
const update = require('./update');

module.exports = {
	create,
	findbyhex,
	findmany,
	count,
	aggregate,
	deletebyhex,
	...update
};
