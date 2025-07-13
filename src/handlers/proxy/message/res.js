// Import body processor
const { processResponseBody } = require('./body');

module.exports = async (ws, data, deps) => {
	const { log, queries } = deps;
	
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

	// Get proxy instance from the WebSocket
	const proxyInstance = ws.proxyInstance;
	if (!proxyInstance) {
		log.error('Proxy instance not available');
		return;
	}

	// Send response back to the HTTP client
	const processedBody = processResponseBody(body, headers);
	
	const success = proxyInstance.sendResponse(requestId, {
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
