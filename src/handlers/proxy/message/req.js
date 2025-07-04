module.exports = async (ws, data, log, queries) => {
	// Log request received from local client
	log.wss(`Request received - Method: ${data.method}, Path: ${data.path}, ID: ${data.id}`);

	// Send status message (not an acknowledgment)
	ws.send(JSON.stringify({
		type: 'status',
		status: 'connected',
		message: 'Connection established'
	}));
}
