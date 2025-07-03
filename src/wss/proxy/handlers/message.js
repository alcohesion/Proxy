const { request: requestQueries } = require('../../../queries');
const log = require('../../../logging');

// Message handler for proxy WebSocket
const handleMessage = async (ws, message, isBinary) => {
	if (!ws.authenticated) {
		return;
	}
	
	try {
		const data = JSON.parse(Buffer.from(message).toString('utf-8'));
		
		// Handle different message types
		switch (data.type) {
			case 'response':
				await handleResponse(ws, data);
				break;
			case 'request':
				await handleRequest(ws, data);
				break;
			default:
				log.warn(`Unknown message type: ${data.type}`);
				ws.send(JSON.stringify({
					error: true,
					message: 'Unknown message type',
					code: 'UNKNOWN_TYPE'
				}));
		}
		
	} catch (error) {
		log.error('Error processing proxy message:', error);
		ws.send(JSON.stringify({
			error: true,
			message: 'Invalid message format',
			code: 'INVALID_JSON'
		}));
	}
};

// Handle response from local client back to HTTP client
const handleResponse = async (ws, data) => {
	const { requestId, statusCode, headers, body, duration } = data;
	
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
		statusCode,
		headers: headers || {},
		body: body || ''
	});

	if (success) {
		// Update request status in database
		try {
			await requestQueries.updateByHex(requestId, {
				response: {
					statusCode,
					headers: headers || {},
					body: body || '',
					duration: duration || 0,
					receivedAt: new Date()
				},
				status: 'responded'
			});
			
			log.info(`Response sent for request ${requestId}: ${statusCode}`);
		} catch (error) {
			log.error(`Error updating request ${requestId}:`, error);
		}
	} else {
		log.warn(`Failed to send response for request ${requestId}`);
	}
};

// Handle request from local client (for backwards compatibility)
const handleRequest = async (ws, data) => {
	// This is for backwards compatibility if needed
	// For now, just log that we received a request
	log.info(`Received request from local client: ${data.method} ${data.path}`);
	
	// Send acknowledgment
	ws.send(JSON.stringify({
		id: data.id,
		type: 'ack',
		message: 'Request received',
		timestamp: new Date().toISOString()
	}));
};

module.exports = handleMessage;
