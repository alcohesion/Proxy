const log = require('../../../../../logging');

// Handle request from local client (for backwards compatibility)
const handleRequest = async (ws, data) => {
	// Log request received from local client
	log.wss(`Request received from local client - Method: ${data.method}, Path: ${data.path}, ID: ${data.id}`);
	
	// Send status message (not an acknowledgment)
	ws.send(JSON.stringify({
		type: 'status',
		status: 'connected',
		message: 'Connection established'
	}));
};

module.exports = handleRequest;
