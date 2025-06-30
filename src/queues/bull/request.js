const { requestQueue } = require('./queues');
const log = require('../../logging');

const RequestWorker = () => {
	// Check if queue is available before setting up worker
	if (!requestQueue) {
		log.warn('Request queue not available, skipping worker initialization');
		return;
	}

	try {
		requestQueue.process('forward', async (job) => {
			const { requestId, method, url, path, query, headers, body } = job.data;
			
			log.request(`Processing request ${requestId}: ${method} ${url}`);
			
			// Here we would send the request to the local client
			// This is handled in the WebSocket service, but we can add
			// additional processing logic here if needed
			
			return { requestId, processed: true };
		});

		requestQueue.on('completed', (job, result) => {
			log.queue(`Request job ${job.id} completed:`, result);
		});

		requestQueue.on('failed', (job, err) => {
			log.queue(`Request job ${job.id} failed:`, err);
		});

		log.worker('Request worker started');
	} catch (error) {
		log.worker('Failed to start request worker:', error);
	}
};

module.exports = RequestWorker;
