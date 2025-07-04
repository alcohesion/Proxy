const log = require('../../../logging');
const { handleResponse, handleError, handleRequest } = require('./message');

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
			case 'error':
				await handleError(ws, data);
				break;
			case 'request':
				await handleRequest(ws, data);
				break;
			default:
				log.warn(`Unknown message type: ${data.type}`);
				ws.send(JSON.stringify({
					type: 'error',
					message: 'Unknown message type',
					code: 'UNKNOWN_TYPE'
				}));
		}
		
	} catch (error) {
		log.error('Error processing proxy message:', error);
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Invalid message format',
			code: 'INVALID_JSON'
		}));
	}
};

module.exports = handleMessage;
