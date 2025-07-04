const handleResponse = require('./res')
const handleError = require('./error');
const handleRequest = require('./req');

module.exports = async (ws, message, isBinary, log, queries) => {
	if (!ws.authenticated) {
		return;
	}

	try {
		const messageString = Buffer.from(message).toString('utf-8');
		
		// Handle simple text messages like "HELLO", "PING", etc.
		if (!messageString.startsWith('{') && !messageString.startsWith('[')) {
			log.info(`Received simple text message: ${messageString}`);
			
			// Handle common text messages
			switch (messageString.toUpperCase()) {
				case 'PING':
					ws.send(JSON.stringify({
						type: 'pong',
						message: 'Connection alive',
						timestamp: new Date().toISOString()
					}));
					return;
				default:
					log.warn(`Unhandled text message: ${messageString}`);
					ws.send(JSON.stringify({
						type: 'error',
						message: 'Text messages not supported. Use JSON format.',
						code: 'TEXT_NOT_SUPPORTED'
					}));
					return;
			}
		}
		
		const data = JSON.parse(messageString);

		const handlers = {
			response: handleResponse,
			error: handleError,
			request: handleRequest
		};

		const handler = handlers[data.type];
		if (handler) {
			await handler(ws, data, log, queries);
		} else {
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