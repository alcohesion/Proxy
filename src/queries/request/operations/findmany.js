const { Request } = require('../../../models');

// Find many requests with options
const findmany = async (query = {}, options = {}) => {
	try {
		let mongoQuery = Request.find(query);
		
		if (options.sort) {
			mongoQuery = mongoQuery.sort(options.sort);
		}
		
		if (options.limit) {
			mongoQuery = mongoQuery.limit(options.limit);
		}
		
		if (options.skip) {
			mongoQuery = mongoQuery.skip(options.skip);
		}
		
		if (options.populate) {
			mongoQuery = mongoQuery.populate(options.populate);
		}
		
		return await mongoQuery.exec();
	} catch (error) {
		console.error('Error finding many requests:', error);
		throw error;
	}
};

module.exports = findmany;
