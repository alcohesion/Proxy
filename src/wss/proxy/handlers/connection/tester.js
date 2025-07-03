const log = require('../../../../logging');

// Connection testing utilities (no ping/pong handling)
class ConnectionTester {
	constructor() {
		// No ping/pong tracking needed
	}

	// Test if a connection is alive by checking its state directly
	async testConnection(connection) {
		return this.isConnectionAlive(connection);
	}

	// Check if connection is alive using uWebSockets.js methods
	isConnectionAlive(connection) {
		if (!connection) {
			log.proxy('Connection test failed: No connection object');
			return false;
		}

		try {
			// Check if connection is authenticated
			if (!connection.authenticated) {
				log.proxy('Connection test failed: Connection not authenticated');
				return false;
			}

			// For uWebSockets.js, check if the connection is still open
			// by trying to access connection-specific methods that fail when closed
			
			// Try to get the remote address - this will throw if connection is closed
			if (typeof connection.getRemoteAddressAsText === 'function') {
				const remoteAddress = connection.getRemoteAddressAsText();
				log.proxy(`Connection state check: Remote address accessible (${remoteAddress}) - Connection OPEN`);
			}
			
			// Try to get buffered amount - this will throw if connection is closed
			if (typeof connection.getBufferedAmount === 'function') {
				const buffered = connection.getBufferedAmount();
				log.proxy(`Connection state check: Buffered amount accessible (${buffered} bytes) - Connection OPEN`);
			}

			// If we get here without exceptions, connection is open
			log.proxy(`Connection test passed: Connection ${connection.connectionId} is OPEN and ready`);
			return true;
			
		} catch (error) {
			// If any WebSocket method throws, the connection is closed
			log.proxy(`Connection test failed: Connection ${connection.connectionId || 'unknown'} is CLOSED - ${error.message}`);
			return false;
		}
	}

	// Quick connection validation - same as isConnectionAlive
	quickValidate(connection) {
		return this.isConnectionAlive(connection);
	}
}

module.exports = new ConnectionTester();
