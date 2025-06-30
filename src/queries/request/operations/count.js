const { Request } = require('../../../models');

// Count requests with query
const count = async (query = {}) => {
	try {
		return await Request.countDocuments(query);
	} catch (error) {
		console.error('Error counting requests:', error);
		throw error;
	}
};

module.exports = count;
