const { Device } = require('../../../models');

// Create operations for devices
const create = async (data) => {
	try {
		const newDevice = new Device(data);
		return await newDevice.save();
	} catch (error) {
		console.error('Error creating device:', error);
		throw error;
	}
};

const createOrUpdate = async (deviceInfo) => {
	try {
		const fingerprint = Buffer.from(`${deviceInfo.ip}${deviceInfo.userAgent}`).toString('base64');
		
		let device = await Device.findOne({ fingerprint });
		
		if (!device) {
			device = new Device({
				fingerprint,
				userAgent: deviceInfo.userAgent,
				ip: deviceInfo.ip,
				requestCount: 1,
				lastActive: new Date()
			});
		} else {
			device.requestCount = (device.requestCount || 0) + 1;
			device.lastActive = new Date();
		}
		
		return await device.save();
	} catch (error) {
		console.error('Error creating/updating device:', error);
		throw error;
	}
};

module.exports = {
	create,
	createOrUpdate
};
