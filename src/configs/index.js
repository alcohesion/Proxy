const { app, security } = require('./app');
const { mongo, redis } = require('./data');
const proxy = require('./proxy');
const { protocol } = require('./protocol');

module.exports = {
	app, security, proxy, protocol,
	mongo, redis
}
