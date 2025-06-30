const { Metrics } = require('../../../models');

// Find many metrics with options
const findmany = async (query = {}, options = {}) => {
	try {
		let mongoQuery = Metrics.find(query);
		
		if (options.sort) {
			mongoQuery = mongoQuery.sort(options.sort);
		}
		
		if (options.limit) {
			mongoQuery = mongoQuery.limit(options.limit);
		}
		
		if (options.skip) {
			mongoQuery = mongoQuery.skip(options.skip);
		}
		
		return await mongoQuery.exec();
	} catch (error) {
		console.error('Error finding many metrics:', error);
		throw error;
	}
};

module.exports = findmany;
