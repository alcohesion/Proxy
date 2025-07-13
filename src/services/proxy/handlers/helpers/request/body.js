// Handle request body reading based on HTTP method
const readRequestBody = (res, request, processCallback, deps) => {
	const { log } = deps;
	
	if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'DELETE') {
		// For methods that typically don't have a body, process immediately
		log.proxy(`Processing ${request.method} request immediately - RequestID: ${request.hex}`);
		processCallback('');
	} else {
		// For methods that might have a body, read it first
		log.proxy(`Setting up body reading for ${request.method} request - RequestID: ${request.hex}`);
		let body = '';
		let hasReceivedData = false;
		let isProcessed = false;
		
		const processOnce = async (bodyData) => {
			if (isProcessed) return;
			isProcessed = true;
			log.proxy(`Processing ${request.method} request with body - RequestID: ${request.hex}, bodyLength: ${bodyData.length}`);
			await processCallback(bodyData);
		};
		
		res.onData(async (chunk, isLast) => {
			hasReceivedData = true;
			body += Buffer.from(chunk).toString();
			log.proxy(`Received data chunk for ${request.method} - RequestID: ${request.hex}, isLast: ${isLast}, bodyLength: ${body.length}`);
			
			if (isLast) {
				await processOnce(body);
			}
		});
		
		// Add a shorter timeout fallback - if no data received, assume empty body
		setTimeout(() => {
			if (!hasReceivedData && !isProcessed) {
				log.proxy(`No data received within 1s for ${request.method} - RequestID: ${request.hex}, processing with empty body`);
				processOnce('');
			}
		}, 1000);
	}
};

module.exports = { readRequestBody };
