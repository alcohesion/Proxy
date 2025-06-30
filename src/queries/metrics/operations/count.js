const { Metrics } = require('../../../models');

// Count metrics with query
const count = async (query = {}) => {
	try {
		return await Metrics.countDocuments(query);
	} catch (error) {
		console.error('Error counting metrics:', error);
		throw error;
	}
};

module.exports = count;
