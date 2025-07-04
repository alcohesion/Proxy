module.exports = (Metrics, log) => {
	// Create a new metrics record
	const create = async (data) => {
		try {
			return await Metrics.create(data);
		} catch (error) {
			log.error('Error creating metrics:', error);
			throw error;
		}
	};

	return { create };
};
