module.exports =  async (ws, data, log, queries) => {
	// Handle nested format: {"type": "error", "data": {"request_id": "...", "error": "...", "code": 502}}
		const errorData = data.data || data; // Support both nested and flat formats
		const { request_id: requestId, error: errorMessage, code } = errorData;
		
		// Log error received from local client
		log.wss(`Error received from local client - RequestID: ${requestId}, Error: ${errorMessage}, Code: ${code}`);
		
		if (!requestId) {
			log.warn('Error missing request_id');
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
