module.exports = Metrics => {
	// Create a new metrics record
	const create = async (data) => {
		try {
			const newMetrics = new Metrics(data);
			return await newMetrics.save();
		} catch (error) {
			console.error('Error creating metrics:', error);
			throw error;
		}
	};

	return { create };
};
