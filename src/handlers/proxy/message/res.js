// Process response body based on content type
const processResponseBody = (body, headers = {}) => {
	// If body is null or undefined, return empty string
	if (body === null || body === undefined) {
		return '';
	}
	
	// If body is already a string, return as is
	if (typeof body === 'string') {
		return body;
	}
	
	// Get content type (case insensitive)
	const contentType = Object.keys(headers).find(key => 
		key.toLowerCase() === 'content-type'
	);
	const contentTypeValue = contentType ? headers[contentType].toLowerCase() : '';
	
	// Handle different content types
	if (contentTypeValue.includes('application/json') || 
		contentTypeValue.includes('text/json')) {
		// JSON content - stringify the object
		try {
			return JSON.stringify(body);
		} catch (error) {
			console.warn('Failed to stringify JSON body:', error);
			return String(body);
		}
	} else if (contentTypeValue.includes('text/')) {
		// Text content - convert to string
		return String(body);
	} else if (typeof body === 'object') {
		// Object without specific content type - assume JSON
		try {
			// Set content-type to application/json if not specified
			if (!contentType) {
				headers['content-type'] = 'application/json';
			}
			return JSON.stringify(body);
		} catch (error) {
			console.warn('Failed to stringify object body:', error);
			return String(body);
		}
	} else {
		// Default case - convert to string
		return String(body);
	}
};

module.exports = async (ws, data, log, queries) => {
	// Handle tunnel message format from client.md only
	if (!data.message || !data.message.payload || data.message.payload.kind !== "HTTP") {
		log.warn('Invalid response message format - tunnel format required');
		return;
	}

	// Extract from tunnel message format
	const httpData = data.message.payload.data;
	const requestId = httpData.requestId;
	const status = httpData.status;
	const status_text = httpData.status_text;
	const headers = httpData.headers;
	const body = httpData.body;
	
	log.wss(`Tunnel response received from local client - RequestID: ${requestId}, Status: ${status}`);

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
	const processedBody = processResponseBody(body, headers);
	
	const success = clientManager.sendResponse(requestId, {
		statusCode: status,
		headers: headers || {},
		body: processedBody
	});

	if (success) {
		// Update request status in database
		try {
			await queries.request.crud.updateResponse(requestId, {
				statusCode: status,
				headers: headers || {},
				body: processedBody,
				duration: 0 // Client should send duration if available
			});

			log.proxy(`Response forwarded to HTTP client - RequestID: ${requestId}, Status: ${status}`);
		} catch (error) {
			log.error(`Error updating request ${requestId}:`, error);
		}
	} else {
		log.warn(`Failed to send response for request ${requestId}`);
	}
}
