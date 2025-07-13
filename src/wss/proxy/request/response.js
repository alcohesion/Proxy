// HTTP response handling for WebSocket requests
const response = {
	send: (pendingRequests, requestId, responseData, log) => {
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
				res.writeStatus(`${responseData.statusCode} ${response.getStatusText(responseData.statusCode)}`);
				
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
	},
	
	getStatusText: (status) => {
		const statuses = {
			200: 'OK',
			201: 'Created',
			202: 'Accepted',
			204: 'No Content',
			400: 'Bad Request',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			405: 'Method Not Allowed',
			500: 'Internal Server Error',
			502: 'Bad Gateway',
			503: 'Service Unavailable',
			504: 'Gateway Timeout'
		};
		return statuses[status] || 'Unknown';
	}
};

module.exports = {
	response
};
