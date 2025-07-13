module.exports = async (ws, data, log, queries) => {
	// Handle tunnel message format for errors from client.md only
	if (!data.message || !data.message.payload || data.message.payload.type !== "Http") {
		log.warn('Invalid error message format - tunnel format required');
		return;
	}

	// Extract from tunnel message format
	const httpData = data.message.payload.data;
	let requestId;
	let errorMessage;
	let code;

	if (httpData.type === "Response") {
		requestId = httpData.requestId;
		code = httpData.status;
		errorMessage = httpData.body ? (httpData.body.error || 'Unknown error') : 'Server error';
	}
	
	log.wss(`Tunnel error received from local client - RequestID: ${requestId}, Error: ${errorMessage}, Code: ${code}`);
		
	if (!requestId) {
		log.warn('Error missing requestId');
		return;
	}

	// Get client manager from the WebSocket's proxy instance
	const clientManager = ws.clientManager;
	if (!clientManager) {
		log.error('Client manager not available');
		return;
	}

	// Send error response back to the HTTP client
	const success = clientManager.sendResponse(requestId, {
		statusCode: code || 500,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			error: errorMessage,
			code: code || 500,
			timestamp: new Date().toISOString()
		})
	});

	if (success) {
		// Update request status in database
		try {
			await queries.request.crud.updateResponse(requestId, {
				statusCode: code || 500,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ error: errorMessage, code: code || 500 }),
				duration: 0
			});
			
			log.proxy(`Error response forwarded to HTTP client - RequestID: ${requestId}, Code: ${code || 500}`);
		} catch (error) {
			log.error(`Error updating request ${requestId}:`, error);
		}
	} else {
		log.warn(`Failed to send error response for request ${requestId}`);
	}
}
