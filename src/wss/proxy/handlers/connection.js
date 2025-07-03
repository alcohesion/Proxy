const { device: deviceQueries } = require('../../../queries');
const log = require('../../../logging');

// Connection handler for proxy WebSocket
const handleConnection = async (ws) => {
	log.connect('Proxy WebSocket connection opened');
	
	// Create or update device record
	try {
		const device = await deviceQueries.createOrUpdate({
			userAgent: ws.userAgent,
			ip: ws.ip
		});
		ws.deviceHex = device.hex;
		
		// Send authentication status message as per client.md
		ws.send(JSON.stringify({
			type: 'auth',
			status: 'authenticated',
			timestamp: new Date().toISOString()
		}));
		
		log.connect(`Device record created/updated - DeviceHex: ${device.hex}`);
	} catch (error) {
		log.error('Error creating device record:', error);
		
		// Send error message
		ws.send(JSON.stringify({
			type: 'error',
			message: 'Failed to create device record',
			code: 'DEVICE_ERROR'
		}));
	}
};

module.exports = handleConnection;
