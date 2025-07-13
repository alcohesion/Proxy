const handleResponse = require('./res')
const handleError = require('./error');
const handleRequest = require('./req');
const { tunnel } = require('../../../utils');

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
					const pongMessage = tunnel.createTunnelMessage("pong", "Control", {
						kind: "Ping",
						message: 'Connection alive',
						timestamp: new Date().toISOString()
					});
					ws.send(JSON.stringify(pongMessage));
					return;
				default:
					log.warn(`Unhandled text message: ${messageString}`);
					const errorMessage = tunnel.createErrorMessage('Text messages not supported. Use JSON format.', 'TEXT_NOT_SUPPORTED');
					ws.send(JSON.stringify(errorMessage));
					return;
			}
		}
		
		const data = JSON.parse(messageString);

		// Handle tunnel message format from client.md
		if (data.message && data.message.payload) {
			const messageType = data.message.metadata.message_type;
			const payloadKind = data.message.payload.kind;
			
			if (payloadKind === "HTTP") {
				const httpDataKind = data.message.payload.data.kind;
				
				if (messageType === "http_response" && httpDataKind === "Response") {
					// Handle HTTP response
					await handleResponse(ws, data, log, queries);
					return;
				} else if (messageType === "http_response" && data.message.payload.data.status >= 400) {
					// Handle HTTP error response
					await handleError(ws, data, log, queries);
					return;
				} else if (messageType === "http_request" && httpDataKind === "Request") {
					// Handle HTTP request (though this is unusual for local client to send)
					await handleRequest(ws, data, log, queries);
					return;
				}
			} else if (payloadKind === "Control") {
				// Control messages are not handled in proxy WebSocket
				// Use metrics WebSocket for status queries and other control operations
				log.warn(`Control messages should use metrics WebSocket endpoint`);
				const errorMessage = tunnel.createErrorMessage('Control messages not supported on proxy endpoint. Use /metrics WebSocket.', 'USE_METRICS_ENDPOINT');
				ws.send(JSON.stringify(errorMessage));
				return;
			}
			
			log.warn(`Unknown tunnel message type: ${messageType}, payload kind: ${payloadKind}`);
			const errorMessage = tunnel.createErrorMessage('Unknown tunnel message format', 'UNKNOWN_TUNNEL_TYPE');
			ws.send(JSON.stringify(errorMessage));
			return;
		}

		// Invalid message format - must use tunnel structure
		log.warn(`Invalid message format - tunnel structure required`);
		const errorMessage = tunnel.createErrorMessage('Message must use tunnel format structure', 'INVALID_STRUCTURE');
		ws.send(JSON.stringify(errorMessage));

	} catch (error) {
		log.error('Error processing proxy message:', error);
		const errorMessage = tunnel.createErrorMessage('Invalid message format', 'INVALID_JSON');
		ws.send(JSON.stringify(errorMessage));
	}
};