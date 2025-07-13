// Connection handler for metrics WebSocket
const log = require('../../logging');

const handleConnection = async (ws) => {
	log.connect('Metrics WebSocket connection opened');
	// Connection-specific setup would go here
};

module.exports = handleConnection;
