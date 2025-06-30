const { handlers: { websocket: forwardRequest } } = require('../../../services/proxy');
const { device: deviceQueries, request: requestQueries } = require('../../../queries');

// Message handler for proxy WebSocket
const handleMessage = async (ws, message, isBinary) => {
	if (!ws.authenticated) {
		return;
	}
	
	try {
		const data = JSON.parse(Buffer.from(message).toString('utf-8'));
		
		// Validate request format
		if (!data.id || !data.method || !data.path) {
			ws.send(JSON.stringify({
				error: true,
				message: 'Invalid request format',
				code: 'INVALID_FORMAT'
			}));
			return;
		}
		
		// Forward the request
		const startTime = Date.now();
		
		try {
			const response = await forwardRequest({
				method: data.method,
				path: data.path,
				headers: data.headers || {},
				body: data.body || ''
			});
			
			const duration = Date.now() - startTime;
			
			// Send response back to client
			ws.send(JSON.stringify({
				id: data.id,
				status: response.statusCode,
				headers: response.headers,
				body: response.body,
				timestamp: new Date().toISOString(),
				duration: duration
			}));
			
			// Log request to database
			try {
				await requestQueries.create({
					method: data.method,
					path: data.path,
					headers: data.headers || {},
					body: data.body || '',
					status: response.statusCode,
					responseHeaders: response.headers,
					responseBody: response.body,
					duration: duration,
					deviceHex: ws.deviceHex
				});
			} catch (logError) {
				console.error('Error logging request:', logError);
			}
			
		} catch (proxyError) {
			const duration = Date.now() - startTime;
			
			// Send error response
			ws.send(JSON.stringify({
				id: data.id,
				error: true,
				message: proxyError.message,
				code: proxyError.code || 'PROXY_ERROR',
				timestamp: new Date().toISOString(),
				duration: duration
			}));
			
			// Log failed request
			try {
				await requestQueries.create({
					method: data.method,
					path: data.path,
					headers: data.headers || {},
					body: data.body || '',
					status: 0,
					responseHeaders: {},
					responseBody: proxyError.message,
					duration: duration,
					deviceHex: ws.deviceHex,
					error: true
				});
			} catch (logError) {
				console.error('Error logging failed request:', logError);
			}
		}
		
	} catch (error) {
		console.error('Error processing proxy message:', error);
		ws.send(JSON.stringify({
			error: true,
			message: 'Invalid message format',
			code: 'INVALID_JSON'
		}));
	}
};

module.exports = handleMessage;
