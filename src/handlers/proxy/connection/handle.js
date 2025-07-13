// Connection handler for proxy WebSocket
const { tunnel } = require('../../../utils');

module.exports = async (ws, log, queries) => {
	log.connect('Proxy WebSocket connection opened');
	
	// Create or update device record
	try {
		const device = await queries.device.crud.createOrUpdate({
			userAgent: ws.userAgent,
			ip: ws.ip
		});
		ws.deviceHex = device.hex;
		
		// Send authentication status message using tunnel format
		const authMessage = tunnel.createAuthMessage('authenticated', 'Device registered and ready for requests');
		ws.send(JSON.stringify(authMessage));
		
		log.connect(`Device record created/updated - DeviceHex: ${device.hex}`);
	} catch (error) {
		log.error('Error creating device record:', error);
		
		// Send error message using tunnel format
		const errorMessage = tunnel.createErrorMessage('Failed to create device record', 'DEVICE_ERROR');
		ws.send(JSON.stringify(errorMessage));
	}
};