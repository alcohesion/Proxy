module.exports = Metrics => {
	// Count operations for metrics
	const count = async (query = {}) => {
		try {
			return await Metrics.countDocuments(query);
		} catch (error) {
			console.error('Error counting metrics:', error);
			throw error;
		}
	};

	const countByStatus = async (active = true) => {
		try {
			return await Metrics.countDocuments({ active });
		} catch (error) {
			console.error('Error counting metrics by status:', error);
			throw error;
		}
	};

	const countByDevice = async (deviceId) => {
		try {
			return await Metrics.countDocuments({ deviceId });
		} catch (error) {
			console.error('Error counting metrics by device:', error);
			throw error;
		}
	};

	return { count, countByStatus, countByDevice };
};
