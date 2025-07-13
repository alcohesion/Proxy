// Connection management logic - simplified but enforce single connection
module.exports = class ConnectionManager {
	constructor(log) {
		this.log = log;
		this.activeConnection = null;
	}

	// Handle new connection attempt - only allow one at a time
	async handleConnectionAttempt(ws) {
		// Generate connection ID for logging purposes
		ws.connectionId = this.generateConnectionId();
		
		// Check if we already have an active connection
		if (this.activeConnection) {
			this.rejectConnection(ws, 'Another client is already connected');
			return false;
		}
		
		// Accept connection
		this.acceptConnection(ws);
		return true;
	}

	// Reject connection
	rejectConnection(ws, reason) {
		this.log.warn(`WebSocket connection rejected - Reason: ${reason}, ConnectionID: ${ws.connectionId}`);
		
		// Send rejection message
		try {
			ws.send(JSON.stringify({
				type: 'error',
				message: reason,
				code: 'CLIENT_ALREADY_CONNECTED',
				timestamp: new Date().toISOString()
			}));
		} catch (error) {
			this.log.error('Error sending rejection message:', error);
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

	// Accept connection
	acceptConnection(ws) {
		// Set as active connection
		this.activeConnection = ws;
		
		// Log connection acceptance
		this.log.connect(`WebSocket connection accepted - ConnectionID: ${ws.connectionId}`);
	}

	// Handle connection close
	handleConnectionClose(ws) {
		this.log.disconnect(`WebSocket connection closed - ConnectionID: ${ws.connectionId}`);
		
		// Clear active connection if this was the active one
		if (this.activeConnection === ws) {
			this.activeConnection = null;
		}
	}

	// Handle connection error
	handleConnectionError(ws, error) {
		this.log.error(`WebSocket connection error - ConnectionID: ${ws.connectionId}, Error: ${error.message}`);
		
		// Clear active connection if this was the active one
		if (this.activeConnection === ws) {
			this.activeConnection = null;
		}
	}

	// Generate unique connection ID
	generateConnectionId() {
		return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}
};
