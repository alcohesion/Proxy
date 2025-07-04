module.exports = (Request, log) => {
	// Count requests with query
	const count = async (query = {}) => {
		try {
			return await Request.countDocuments(query);
		} catch (error) {
			log.error('Error counting requests:', error);
			throw error;
		}
	};

	// Aggregate requests
	const aggregate = async (pipeline) => {
		try {
			return await Request.aggregate(pipeline);
		} catch (error) {
			log.error('Error aggregating requests:', error);
			throw error;
		}
	};

	// Count requests by status
	const countByStatus = async (status) => {
		try {
			return await Request.countDocuments({ status });
		} catch (error) {
			log.error('Error counting requests by status:', error);
			throw error;
		}
	};

	return { count, aggregate, countByStatus };
};
