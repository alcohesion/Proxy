// Local client management utility
class ClientManager {
	constructor() {
		this.localClient = null;
		this.pendingRequests = new Map();
	}

	setLocalClient(client) {
		this.localClient = client;
	}

	getLocalClient() {
		return this.localClient;
	}

	clearLocalClient() {
		this.localClient = null;
	}

	isClientConnected() {
		if (!this.localClient) {
			return false;
		}
		
		// Check if client is authenticated
		if (!this.localClient.authenticated) {
			return false;
		}
		
		// Try to check if WebSocket is still open using uWebSockets.js methods
		try {
			// If we can get buffered amount, connection is likely open
			if (typeof this.localClient.getBufferedAmount === 'function') {
				this.localClient.getBufferedAmount();
			}
			return true;
		} catch (error) {
			// If any WebSocket method throws, connection is closed
			console.warn('Client connection test failed:', error.message);
			return false;
		}
	}

	addPendingRequest(requestId, data) {
		this.pendingRequests.set(requestId, data);
	}

	removePendingRequest(requestId) {
		this.pendingRequests.delete(requestId);
	}

	getPendingRequest(requestId) {
		return this.pendingRequests.get(requestId);
	}

	hasPendingRequest(requestId) {
		return this.pendingRequests.has(requestId);
	}

	getPendingRequestsCount() {
		return this.pendingRequests.size;
	}

	// Send response back to pending HTTP request
	sendResponse(requestId, responseData) {
		const pendingRequest = this.pendingRequests.get(requestId);
		if (!pendingRequest) {
			console.warn(`No pending request found for ID: ${requestId}`);
			return false;
		}

		const { res, request } = pendingRequest;
		
		// Check if response is already sent or aborted
		if (res.aborted) {
			console.warn(`Response already aborted for request: ${requestId}`);
			this.removePendingRequest(requestId);
			return false;
		}

		try {
			// Determine content type from response headers
			const contentType = responseData.headers['content-type'] || 
							   responseData.headers['Content-Type'] || 
							   'text/plain';

			// Send response using cork for proper uWebSockets handling
			res.cork(() => {
				res.writeStatus(`${responseData.statusCode} ${this.getStatusText(responseData.statusCode)}`);
				
				// Normalize and deduplicate headers to prevent conflicts
				if (responseData.headers) {
					const normalizedHeaders = {};
					
					// Headers that uWebSockets.js automatically adds - exclude these to prevent duplicates
					const autoAddedHeaders = new Set([
						'date',           // uWebSockets.js adds Date header automatically
						'content-length', // uWebSockets.js calculates this based on body
						'connection',     // Managed by uWebSockets.js
						'server'          // May be added automatically
					]);
					
					// Normalize header names to lowercase and remove duplicates
					Object.keys(responseData.headers).forEach(key => {
						const normalizedKey = key.toLowerCase();
						
						// Skip headers that uWebSockets.js adds automatically to prevent duplicates
						if (autoAddedHeaders.has(normalizedKey)) {
							return;
						}
						
						// Only keep the first occurrence of each header (case-insensitive)
						if (!normalizedHeaders[normalizedKey]) {
							normalizedHeaders[normalizedKey] = responseData.headers[key];
						}
					});
					
					// Write normalized headers
					Object.keys(normalizedHeaders).forEach(key => {
						res.writeHeader(key, normalizedHeaders[key]);
					});
				}
				
				// Send response body
				if (responseData.body) {
					res.end(responseData.body);
				} else {
					res.end();
				}
			});

			// Clean up pending request
			this.removePendingRequest(requestId);
			return true;

		} catch (error) {
			console.error(`Error sending response for request ${requestId}:`, error);
			this.removePendingRequest(requestId);
			return false;
		}
	}

	getStatusText(status) {
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
}

module.exports = ClientManager;
