module.exports = (Device, log) => {
	// Create operations for devices
	const create = async (data) => {
		try {
			return await Device.create(data);
		} catch (error) {
			log.error('Error creating device:', error);
			throw error;
		}
	};

	const createOrUpdate = async (deviceInfo) => {
		try {
			const fingerprint = Buffer.from(`${deviceInfo.ip}${deviceInfo.userAgent}`).toString('base64');

			let device = await Device.findOne({ fingerprint });

			if (!device) {
				device = await Device.create({
					fingerprint,
					userAgent: deviceInfo.userAgent,
					ip: deviceInfo.ip,
					requestCount: 1,
					lastActive: new Date()
				});
			} else {
				device.requestCount = (device.requestCount || 0) + 1;
				device.lastActive = new Date();
				await device.save();
			}

			return device;
		} catch (error) {
			log.error('Error creating/updating device:', error);
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
			log.error('Error updating device by hex:', error);
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
			log.error('Error updating device stats:', error);
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
			log.error('Error blocking device:', error);
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
			log.error('Error unblocking device:', error);
			throw error;
		}
	};

	return { create, createOrUpdate, updateByHex, updateStats, blockDevice, unblockDevice };
};