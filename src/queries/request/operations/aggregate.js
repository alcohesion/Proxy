const { Request } = require('../../../models');

// Aggregate requests
const aggregate = async (pipeline) => {
	try {
		return await Request.aggregate(pipeline);
	} catch (error) {
		console.error('Error aggregating requests:', error);
		throw error;
	}
};

module.exports = aggregate;
