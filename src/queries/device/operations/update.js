const { Device } = require('../../../models');

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

module.exports = {
	updateByHex,
	updateStats,
	blockDevice,
	unblockDevice
};
