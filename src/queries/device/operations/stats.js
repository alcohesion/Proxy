
module.exports = (Device, log) => {
	// Count operations for devices
	const count = async (query = {}) => {
		try {
			return await Device.countDocuments(query);
		} catch (error) {
			log.error('Error counting devices:', error);
			throw error;
		}
	};

	const countByStatus = async (active = true) => {
		try {
			return await Device.countDocuments({ active });
		} catch (error) {
			log.error('Error counting devices by status:', error);
			throw error;
		}
	};

	const countTotal = async () => {
		try {
			return await Device.countDocuments();
		} catch (error) {
			log.error('Error counting total devices:', error);
			throw error;
		}
	};

	return { count, countByStatus, countTotal };
};