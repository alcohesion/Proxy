// HTTP response handling for WebSocket requests
const getStatusText = require('./status');

const send = (pendingRequests, requestId, responseData, log) => {
	const pendingRequest = pendingRequests.get(requestId);
	if (!pendingRequest) {
		log.warn(`No pending request found for ID: ${requestId}`);
		return false;
	}

	const { res, request } = pendingRequest;
	
	if (res.aborted) {
		log.warn(`Response already aborted for request: ${requestId}`);
		pendingRequests.delete(requestId);
		return false;
	}

	try {
		res.cork(() => {
			res.writeStatus(`${responseData.statusCode} ${getStatusText(responseData.statusCode)}`);
			
			if (responseData.headers) {
				const normalizedHeaders = {};
				
				const autoAddedHeaders = new Set([
					'date',
					'content-length', 
					'connection',
					'server'
				]);
				
				Object.keys(responseData.headers).forEach(key => {
					const normalizedKey = key.toLowerCase();
					
					if (autoAddedHeaders.has(normalizedKey)) {
						return;
					}
					
					if (!normalizedHeaders[normalizedKey]) {
						normalizedHeaders[normalizedKey] = responseData.headers[key];
					}
				});
				
				Object.keys(normalizedHeaders).forEach(key => {
					res.writeHeader(key, normalizedHeaders[key]);
				});
			}
			
			if (responseData.body) {
				res.end(responseData.body);
			} else {
				res.end();
			}
		});

		pendingRequests.delete(requestId);
		return true;

	} catch (error) {
		log.error(`Error sending response for request ${requestId}:`, error);
		pendingRequests.delete(requestId);
		return false;
	}
};

module.exports = {
	send,
	getStatusText
};
