const { app, security } = require('./app');
const { mongo, redis } = require('./data');
const proxy = require('./proxy');

module.exports = {
	app, security, proxy,
	mongo, redis
}
