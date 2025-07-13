const queries = require('../queries');
const log = require('../logging');

const {
	proxy: { auth, message, connection: { ConnectionManager, handleConnection } }
} = require('../handlers');

// Main proxy WebSocket endpoint
class ProxyWebSocket {
	constructor(app, client, settings) {
		this.app = app;
		this.client = client;
		this.connections = new Map();
		this.authenticatedConnections = new Set();
		this.connectionManager = new ConnectionManager(log);
		this.init(app, settings);
	}
	
	init = (app, settings) => {
		// Main proxy WebSocket endpoint
		app.ws('/', {
			compression: settings.compression,
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
				if (!auth(ws, ws.token)) return;
				
				// Use connection manager to handle connection attempt
				const connectionAccepted = await this.connectionManager.handleConnectionAttempt(ws);
				if (!connectionAccepted) return;
				
				this.authenticatedConnections.add(ws);
				await handleConnection(ws, log, queries);
				
				// Pass client manager to WebSocket for response handling
				ws.clientManager = this.client;
				
				// Set this WebSocket as the local client after successful connection
				this.client.setLocalClient(ws);
				console.log('Local client connected and registered for request forwarding');
			},
			
			message: async (ws, messageData, isBinary) => {
				await message(ws, messageData, isBinary, log, queries);
			},
			
			close: (ws, code, message) => {
				console.log('Proxy WebSocket connection closed');
				this.authenticatedConnections.delete(ws);
				
				// Use connection manager to handle connection close
				this.connectionManager.handleConnectionClose(ws);
				
				// Unset local client when connection closes
				this.client.clearLocalClient();
				console.log('Local client disconnected');
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
			authenticated: this.authenticatedConnections.size,
			hasActiveConnection: this.client.isClientConnected() // Use actual WebSocket state
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
	
	// Get active connection from connection manager
	getActiveConnection() {
		return this.connectionManager.getActiveConnection();
	}
	
	// Check if there's an active connection
	hasActiveConnection() {
		return this.connectionManager.hasActiveConnection();
	}
	
	// Handle connection error (for external error handling)
	handleConnectionError(ws, error) {
		this.connectionManager.handleConnectionError(ws, error);
	}
}

module.exports = ProxyWebSocket;
