const { metricsQueue } = require('./queues');
const log = require('../../logging');
const { Metrics } = require('../../models');
const { metrics: metricsQuery } = require('../../queries');
const { metrics: { broadcastToMetrics } } = require('../../utils');

const MetricsWorker = () => {
	// Check if queue is available before setting up worker
	if (!metricsQueue) {
		log.warn('Metrics queue not available, skipping worker initialization');
		return;
	}

	try {
	metricsQueue.process('response', async (job) => {
		const { requestId, statusCode, duration, timestamp } = job.data;
		
		try {
			// Create metrics record
			const metrics = await metricsQuery.create({
				type: 'response',
				data: {
					requestId,
					statusCode,
					duration,
					success: statusCode >= 200 && statusCode < 400
				},
				timestamp: new Date(timestamp)
			});
			
			// Broadcast to connected dashboards
			broadcastToMetrics({
				type: 'new_response',
				data: {
					requestId,
					statusCode,
					duration,
					timestamp
				}
			});
			
			log.metrics(`Metrics processed for request ${requestId}`);
			
		} catch (error) {
			log.queue('Error processing metrics:', error);
			throw error;
		}
		
		return { requestId, processed: true };
	});

	metricsQueue.process('error', async (job) => {
		const { requestId, error, timestamp } = job.data;
		
		try {
			const metrics = await metricsQuery.create({
				type: 'error',
				data: {
					requestId,
					error,
					timestamp
				},
				timestamp: new Date(timestamp)
			});
			
			broadcastToMetrics({
				type: 'new_error',
				data: {
					requestId,
					error,
					timestamp
				}
			});
			
		} catch (err) {
			log.queue('Error processing error metrics:', err);
			throw err;
		}
		
		return { requestId, processed: true };
	});

	metricsQueue.on('completed', (job, result) => {
		log.queue(`Metrics job ${job.id} completed`);
	});

	metricsQueue.on('failed', (job, err) => {
		log.queue(`Metrics job ${job.id} failed:`, err);
	});

	log.worker('Metrics worker started');
	} catch (error) {
		log.worker('Failed to start metrics worker:', error);
	}
};

module.exports = MetricsWorker;
