const { metricsQueue } = require('./queues');
const { Metrics } = require('../../models');
const { metrics: metricsQuery } = require('../../queries');
const { broadcastToMetrics } = require('../../services/metrics/websocket');

const MetricsWorker = () => {
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
			
			console.log(`Metrics processed for request ${requestId}`);
			
		} catch (error) {
			console.error('Error processing metrics:', error);
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
			console.error('Error processing error metrics:', err);
			throw err;
		}
		
		return { requestId, processed: true };
	});

	metricsQueue.on('completed', (job, result) => {
		console.log(`Metrics job ${job.id} completed`);
	});

	metricsQueue.on('failed', (job, err) => {
		console.error(`Metrics job ${job.id} failed:`, err);
	});

	console.log('Metrics worker started');
};

module.exports = MetricsWorker;
