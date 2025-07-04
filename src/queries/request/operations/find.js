module.exports = (Request, log) => {
	// Find request by hex
	const findbyhex = async (hex) => {
		try {
			return await Request.findOne({ hex });
		} catch (error) {
			log.error('Error finding request by hex:', error);
			throw error;
		}
	};

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
			log.error('Error finding many requests:', error);
			throw error;
		}
	};

	return { findbyhex, findmany };
};
