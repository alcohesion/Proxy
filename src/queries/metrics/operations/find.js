module.exports = (Metrics, log) => {
	// Find metrics by hex
	const findbyhex = async (hex) => {
		try {
			return await Metrics.findOne({ hex });
		} catch (error) {
			log.error('Error finding metrics by hex:', error);
			throw error;
		}
	};

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
			log.error('Error finding many metrics:', error);
			throw error;
		}
	};

	return { findbyhex, findmany };
};