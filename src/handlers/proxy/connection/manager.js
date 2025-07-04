const ConnectionValidator = require('./validator');
// Connection management logic
module.exports = class ConnectionManager {
	constructor(log) {
		this.log = log;
		this.validator = new ConnectionValidator(log);
		this.connections = new Map();
	}

	// Handle new connection attempt
	async handleConnectionAttempt(ws) {
		// Generate connection ID
		ws.connectionId = this.generateConnectionId();
		
		// Validate connection
		const validation = this.validator.canConnect(ws);
		
		if (!validation.allowed) {
			// Reject connection
			this.rejectConnection(ws, validation.reason, validation.code);
			return false;
		}

		// Accept connection
		this.acceptConnection(ws);
		return true;
	}

	// Accept connection
	acceptConnection(ws) {
		// Store connection
		this.connections.set(ws.connectionId, ws);
		
		// Set as active connection
		this.validator.setActiveConnection(ws);
		
		// Set up connection event handlers
		this.setupConnectionHandlers(ws);
		
		this.log.connect(`WebSocket connection accepted - ConnectionID: ${ws.connectionId}`);
	}

	// Reject connection
	rejectConnection(ws, reason, code) {
		this.log.warn(`WebSocket connection rejected - Reason: ${reason}, Code: ${code}`);
		
		// Send rejection message
		try {
			ws.send(JSON.stringify({
				type: 'error',
				message: reason,
				code: code,
				timestamp: new Date().toISOString()
			}));
		} catch (error) {
			log.error('Error sending rejection message:', error);
		}
		
		// Close connection
		setTimeout(() => {
			try {
				ws.close();
			} catch (error) {
				this.log.error('Error closing rejected connection:', error);
			}
		}, 100);
	}

	// Setup connection event handlers
	setupConnectionHandlers(ws) {
		// Note: uWebSockets.js handles close and error events differently
		// The main WebSocket handler will call our methods directly
		this.log.proxy(`Connection event handlers setup - ConnectionID: ${ws.connectionId}`);
	}

	// Handle connection close
	handleConnectionClose(ws) {
		this.log.disconnect(`WebSocket connection closed - ConnectionID: ${ws.connectionId}`);
		
		// Remove from connections
		this.connections.delete(ws.connectionId);
		
		// Clear active connection if this was the active one
		if (this.validator.getActiveConnection() === ws) {
			this.validator.clearActiveConnection();
		}
	}

	// Handle connection error
	handleConnectionError(ws, error) {
		this.log.error(`WebSocket connection error - ConnectionID: ${ws.connectionId}, Error: ${error.message}`);
		
		// Remove from connections
		this.connections.delete(ws.connectionId);
		
		// Clear active connection if this was the active one
		if (this.validator.getActiveConnection() === ws) {
			this.validator.clearActiveConnection();
		}
	}

	// Generate unique connection ID
	generateConnectionId() {
		return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	// Get active connection
	getActiveConnection() {
		return this.validator.getActiveConnection();
	}

	// Check if there's an active connection
	hasActiveConnection() {
		return this.validator.hasActiveConnection();
	}

	// Get connection count
	getConnectionCount() {
		return this.connections.size;
	}
};
