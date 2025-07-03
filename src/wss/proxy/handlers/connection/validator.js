const log = require('../../../../logging');
const ConnectionTester = require('./tester');

// Connection validation logic
class ConnectionValidator {
	constructor() {
		this.activeConnection = null;
		this.connectionStartTime = null;
		this.tester = new ConnectionTester();
	}

	// Check if a connection can be established
	canConnect(ws) {
		// If no active connection, allow
		if (!this.activeConnection) {
			log.proxy('No active connection - allowing new connection');
			return { allowed: true };
		}

		// Check if active connection is still actually OPEN
		const isActiveConnectionOpen = this.isConnectionActuallyOpen(this.activeConnection);
		
		if (isActiveConnectionOpen) {
			// Active connection is still OPEN, reject new connection
			log.warn(`Connection rejected - Active client still OPEN and connected since ${this.connectionStartTime}`);
			return { 
				allowed: false, 
				reason: 'Another client is already connected and OPEN',
				code: 'CLIENT_ALREADY_CONNECTED'
			};
		} else {
			// Active connection is CLOSED, allow new connection to override
			log.proxy(`Previous connection is CLOSED/invalid, allowing new connection to override`);
			this.clearActiveConnection();
			return { allowed: true };
		}
	}

	// Check if connection is actually open by testing WebSocket state
	isConnectionActuallyOpen(connection) {
		if (!connection) {
			return false;
		}

		// Use the tester to check actual connection state
		const isValid = this.tester.quickValidate(connection);
		
		if (isValid) {
			log.proxy(`Connection state: ${connection.connectionId} is OPEN and valid`);
		} else {
			log.proxy(`Connection state: ${connection.connectionId} is CLOSED or invalid`);
		}
		
		return isValid;
	}

	// Set active connection
	setActiveConnection(ws) {
		this.activeConnection = ws;
		this.connectionStartTime = new Date().toISOString();
		log.proxy(`Client connection established - ConnectionID: ${ws.connectionId || 'unknown'}`);
	}

	// Clear active connection
	clearActiveConnection() {
		if (this.activeConnection) {
			log.proxy(`Client connection cleared - ConnectionID: ${this.activeConnection.connectionId || 'unknown'}`);
		}
		this.activeConnection = null;
		this.connectionStartTime = null;
	}

	// Check if connection is still valid
	isConnectionValid(connection) {
		if (!connection) {
			log.proxy('Connection validation: No connection object');
			return false;
		}
		
		// Use quick validation first (no network overhead)
		return this.tester.quickValidate(connection);
	}

	// Get current active connection
	getActiveConnection() {
		return this.activeConnection;
	}

	// Check if there's an active connection
	hasActiveConnection() {
		if (!this.activeConnection) {
			return false;
		}
		
		// Check if the connection is actually OPEN
		const isOpen = this.isConnectionActuallyOpen(this.activeConnection);
		if (!isOpen) {
			// Connection is CLOSED, clear it
			log.proxy(`Active connection is CLOSED, clearing it`);
			this.clearActiveConnection();
			return false;
		}
		
		return true;
	}

	// Test connection by checking its state directly
	async testConnection(connection) {
		if (!connection) return false;
		
		try {
			// Check if connection is still open using uWebSockets.js methods
			// We'll use the connection tester for this
			const tester = require('./tester');
			return tester.isConnectionAlive(connection);
		} catch (error) {
			log.proxy(`Connection test failed for ${connection.connectionId}: ${error.message}`);
			return false;
		}
	}
}

module.exports = ConnectionValidator;
