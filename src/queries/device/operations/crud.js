module.exports = Device => {
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

	// Update operations for devices
	const updateByHex = async (hex, updateData) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ ...updateData, updatedAt: new Date() },
				{ new: true, runValidators: true }
			);
		} catch (error) {
			console.error('Error updating device by hex:', error);
			throw error;
		}
	};

	const updateStats = async (hex, statsUpdate) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{
					$inc: statsUpdate,
					$set: {
						'stats.lastRequestAt': new Date(),
						updatedAt: new Date()
					}
				},
				{ new: true }
			);
		} catch (error) {
			console.error('Error updating device stats:', error);
			throw error;
		}
	};

	const blockDevice = async (hex) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ blocked: true, updatedAt: new Date() },
				{ new: true }
			);
		} catch (error) {
			console.error('Error blocking device:', error);
			throw error;
		}
	};

	const unblockDevice = async (hex) => {
		try {
			return await Device.findOneAndUpdate(
				{ hex },
				{ blocked: false, updatedAt: new Date() },
				{ new: true }
			);
		} catch (error) {
			console.error('Error unblocking device:', error);
			throw error;
		}
	};

	return { create, createOrUpdate, updateByHex, updateStats, blockDevice, unblockDevice };
};