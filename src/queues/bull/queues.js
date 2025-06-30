const Queue = require('bull');
const { redis } = require('../../configs');

const requestQueue = new Queue('request processing', {
	redis: {
		host: redis.host,
		port: redis.port,
		password: redis.password,
		db: redis.db
	}
});

const metricsQueue = new Queue('metrics processing', {
	redis: {
		host: redis.host,
		port: redis.port,
		password: redis.password,
		db: redis.db
	}
});

module.exports = {
	requestQueue,
	metricsQueue
};
