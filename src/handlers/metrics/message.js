const queries = require('../../queries');

// Message handler for metrics WebSocket
const handleMessage = async (ws, message, isBinary, metricsInstance) => {
	if (!ws.authenticated) {
		return;
	}
	
	try {
		const data = JSON.parse(Buffer.from(message).toString('utf-8'));
		
		switch (data.type) {
			case 'get_metrics':
				await metricsInstance.sendMetrics(ws);
				break;
			case 'get_devices':
				await metricsInstance.sendDevices(ws, data.limit || 50);
				break;
			case 'get_recent_requests':
				await metricsInstance.sendRecentRequests(ws, data.limit || 50);
				break;
			case 'get_system':
				await metricsInstance.sendSystemStatus(ws);
				break;
			default:
				ws.send(JSON.stringify({
					type: 'error',
					message: 'Unknown message type',
					code: 'UNKNOWN_TYPE'
				}));
		}
		
	} catch (error) {
		console.error('Error processing metrics message:', error);
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Invalid message format',
			code: 'INVALID_JSON'
		}));
	}
};

module.exports = handleMessage;
