// Connection management logic - simplified
module.exports = class ConnectionManager {
	constructor(log) {
		this.log = log;
	}

	// Handle new connection attempt - always accept, let WebSocket handle state
	async handleConnectionAttempt(ws) {
		// Generate connection ID for logging purposes
		ws.connectionId = this.generateConnectionId();
		
		// Always accept connection
		this.acceptConnection(ws);
		return true;
	}

	// Accept connection
	acceptConnection(ws) {
		// Log connection acceptance
		this.log.connect(`WebSocket connection accepted - ConnectionID: ${ws.connectionId}`);
	}

	// Handle connection close
	handleConnectionClose(ws) {
		this.log.disconnect(`WebSocket connection closed - ConnectionID: ${ws.connectionId}`);
	}

	// Handle connection error
	handleConnectionError(ws, error) {
		this.log.error(`WebSocket connection error - ConnectionID: ${ws.connectionId}, Error: ${error.message}`);
	}

	// Generate unique connection ID
	generateConnectionId() {
		return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}
};
