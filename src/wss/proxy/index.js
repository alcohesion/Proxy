const uWs = require('uWebSockets.js');
const { auth, connection, message } = require('./handlers');

// Main proxy WebSocket endpoint
class ProxyWebSocket {
	constructor(app) {
		this.app = app;
		this.connections = new Map();
		this.authenticatedConnections = new Set();
		this.init(app);
	}
	
	init = app => {
		// Main proxy WebSocket endpoint
		app.ws('/', {
			compression: uWs.SHARED_COMPRESSOR,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 960,
			
			upgrade: async (res, req, context) => {
				try {
					const token = req.getQuery('token');
					const userAgent = req.getHeader('user-agent');
					const ip = req.getHeader('x-forwarded-for') || req.getHeader('x-real-ip') || 'unknown';
					
					// Pass connection data to WebSocket
					res.upgrade(
						{ 
							token: token,
							userAgent: userAgent,
							ip: ip,
							authenticated: false
						},
						req.getHeader('sec-websocket-key'),
						req.getHeader('sec-websocket-protocol'),
						req.getHeader('sec-websocket-extensions'),
						context
					);
				} catch (error) {
					console.error('Proxy WebSocket upgrade error:', error);
					res.writeStatus('400 Bad Request').end('WebSocket upgrade failed');
				}
			},
			
			open: async (ws) => {
				// Authenticate first
				if (!auth(ws, ws.token)) {
					return;
				}
				
				this.authenticatedConnections.add(ws);
				
				// Handle connection setup
				await connection(ws);
			},
			
			message: async (ws, messageData, isBinary) => {
				await message(ws, messageData, isBinary);
			},
			
			close: (ws, code, message) => {
				console.log('Proxy WebSocket connection closed');
				this.authenticatedConnections.delete(ws);
			},
			
			drain: (ws) => {
				console.log('Proxy WebSocket backpressure: ' + ws.getBufferedAmount());
			}
		});
	}
	
	// Get connection statistics
	getStats() {
		return {
			total: this.authenticatedConnections.size,
			authenticated: this.authenticatedConnections.size
		};
	}
	
	// Broadcast message to all authenticated connections
	broadcast(message) {
		const messageStr = JSON.stringify(message);
		this.authenticatedConnections.forEach(ws => {
			if (ws.authenticated) {
				ws.send(messageStr);
			}
		});
	}
}

module.exports = ProxyWebSocket;
