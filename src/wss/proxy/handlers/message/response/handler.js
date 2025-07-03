const { request: requestQueries } = require('../../../../../queries');
const log = require('../../../../../logging');

// Handle response from local client back to HTTP client
const handleResponse = async (ws, data) => {
	// Handle nested format: {"type": "response", "data": {"id": "...", "status": 200, ...}}
	const responseData = data.data || data; // Support both nested and flat formats
	const { id: requestId, status, status_text, headers, body } = responseData;
	
	// Log response received from local client
	log.wss(`Response received from local client - RequestID: ${requestId}, Status: ${status}`);
	
	if (!requestId) {
		log.warn('Response missing requestId');
		return;
	}

	// Get client manager from the WebSocket's proxy instance
	const clientManager = ws.clientManager;
	if (!clientManager) {
		log.error('Client manager not available');
		return;
	}

	// Send response back to the HTTP client
	const success = clientManager.sendResponse(requestId, {
		statusCode: status,
		headers: headers || {},
		body: body || ''
	});

	if (success) {
		// Update request status in database
		try {
			await requestQueries.updateResponse(requestId, {
				statusCode: status,
				headers: headers || {},
				body: body || '',
				duration: 0 // Client should send duration if available
			});
			
			log.proxy(`Response forwarded to HTTP client - RequestID: ${requestId}, Status: ${status}`);
		} catch (error) {
			log.error(`Error updating request ${requestId}:`, error);
		}
	} else {
		log.warn(`Failed to send response for request ${requestId}`);
	}
};

module.exports = handleResponse;
