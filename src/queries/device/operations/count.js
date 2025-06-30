const { Device } = require('../../../models');

// Count operations for devices
const count = async (query = {}) => {
	try {
		return await Device.countDocuments(query);
	} catch (error) {
		console.error('Error counting devices:', error);
		throw error;
	}
};

const countByStatus = async (active = true) => {
	try {
		return await Device.countDocuments({ active });
	} catch (error) {
		console.error('Error counting devices by status:', error);
		throw error;
	}
};

const countTotal = async () => {
	try {
		return await Device.countDocuments();
	} catch (error) {
		console.error('Error counting total devices:', error);
		throw error;
	}
};

module.exports = {
	count,
	countByStatus,
	countTotal
};
