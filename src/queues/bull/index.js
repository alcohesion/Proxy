const queues = require('./queues');
const RequestWorker = require('./request');
const MetricsWorker = require('./metrics');

module.exports = {
	requestQueue: queues.requestQueue,
	metricsQueue: queues.metricsQueue,
	RequestWorker,
	MetricsWorker
};
