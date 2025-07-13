// Request status tracking service
module.exports = (queries, log) => {
	// Get request status by hex ID
	const getRequestStatus = async (hex) => {
		try {
			const request = await queries.request.find.byHex(hex);
			if (!request) {
				return null;
			}

			return {
				requestId: request.hex,
				status: request.status,
				method: request.method,
				path: request.path,
				createdAt: request.createdAt,
				updatedAt: request.updatedAt,
				response: request.response.statusCode ? {
					statusCode: request.response.statusCode,
					receivedAt: request.response.receivedAt,
					duration: request.response.duration
				} : null,
				error: request.error
			};
		} catch (error) {
			log.error('Error getting request status:', error);
			throw error;
		}
	};

	// Get all requests by status
	const getRequestsByStatus = async (status, limit = 100) => {
		try {
			const requests = await queries.request.find.byStatus(status, { limit });
			return requests.map(request => ({
				requestId: request.hex,
				status: request.status,
				method: request.method,
				path: request.path,
				createdAt: request.createdAt,
				updatedAt: request.updatedAt,
				response: request.response.statusCode ? {
					statusCode: request.response.statusCode,
					receivedAt: request.response.receivedAt,
					duration: request.response.duration
				} : null,
				error: request.error
			}));
		} catch (error) {
			log.error('Error getting requests by status:', error);
			throw error;
		}
	};

	// Get status statistics
	const getStatusStats = async () => {
		try {
			const stats = await queries.request.stats.statusDistribution();
			return stats;
		} catch (error) {
			log.error('Error getting status statistics:', error);
			throw error;
		}
	};

	return {
		getRequestStatus,
		getRequestsByStatus,
		getStatusStats
	};
};
