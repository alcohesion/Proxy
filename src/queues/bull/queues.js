const Queue = require('bull');
const log = require('../../logging');
const { redis } = require('../../configs');

let requestQueue = null;
let metricsQueue = null;

// Initialize queues with error handling
try {
	const redisConfig = {
		host: redis.host,
		port: redis.port,
		password: redis.password,
		db: redis.db,
		maxRetriesPerRequest: 3,
		retryDelayOnFailover: 100,
		enableReadyCheck: false,
		maxRetriesPerRequest: null,
		lazyConnect: true
	};

	requestQueue = new Queue('request processing', {
		redis: redisConfig
	});

	metricsQueue = new Queue('metrics processing', {
		redis: redisConfig
	});

	// Add error handlers
	requestQueue.on('error', (error) => {
		log.redis('Request queue error:', error);
	});

	requestQueue.on('ready', () => {
		log.redis('Request queue ready');
	});

	requestQueue.on('failed', (job, err) => {
		log.queue('Request job failed:', err);
	});

	requestQueue.on('completed', (job) => {
		log.queue('Request job completed:', job.id);
	});

	metricsQueue.on('error', (error) => {
		log.redis('Metrics queue error:', error);
	});

	metricsQueue.on('ready', () => {
		log.redis('Metrics queue ready');
	});

	metricsQueue.on('failed', (job, err) => {
		log.queue('Metrics job failed:', err);
	});

	metricsQueue.on('completed', (job) => {
		log.queue('Metrics job completed:', job.id);
	});

	log.redis('Bull queues initialized successfully');
} catch (error) {
	log.redis('Failed to initialize Bull queues:', error);
	log.warn('Continuing without queue functionality...');
}

module.exports = {
	requestQueue,
	metricsQueue
};
