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

	// Get status distribution
	const statusDistribution = async () => {
		try {
			const pipeline = [
				{
					$group: {
						_id: '$status',
						count: { $sum: 1 },
						lastRequest: { $max: '$createdAt' }
					}
				},
				{
					$sort: { count: -1 }
				}
			];

			const results = await Request.aggregate(pipeline);
			
			// Convert to more readable format
			const distribution = {};
			let total = 0;

			results.forEach(result => {
				distribution[result._id] = {
					count: result.count,
					lastRequest: result.lastRequest
				};
				total += result.count;
			});

			return {
				distribution,
				total,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			log.error('Error getting status distribution:', error);
			throw error;
		}
	};

	return { count, aggregate, countByStatus, statusDistribution };
};
