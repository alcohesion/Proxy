const { requestQueue } = require('./queues');

const RequestWorker = () => {
	requestQueue.process('forward', async (job) => {
		const { requestId, method, url, path, query, headers, body } = job.data;
		
		console.log(`Processing request ${requestId}: ${method} ${url}`);
		
		// Here we would send the request to the local client
		// This is handled in the WebSocket service, but we can add
		// additional processing logic here if needed
		
		return { requestId, processed: true };
	});

	requestQueue.on('completed', (job, result) => {
		console.log(`Request job ${job.id} completed:`, result);
	});

	requestQueue.on('failed', (job, err) => {
		console.error(`Request job ${job.id} failed:`, err);
	});

	console.log('Request worker started');
};

module.exports = RequestWorker;
