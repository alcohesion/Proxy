const { device: deviceQueries } = require('../../../queries');

// Connection handler for proxy WebSocket
const handleConnection = async (ws) => {
	console.log('Proxy WebSocket connection opened');
	
	// Create or update device record
	try {
		const device = await deviceQueries.createOrUpdate({
			userAgent: ws.userAgent,
			ip: ws.ip
		});
		ws.deviceHex = device.hex;
	} catch (error) {
		console.error('Error creating device record:', error);
	}
};

module.exports = handleConnection;
