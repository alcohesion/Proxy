module.exports = (Device, log) => {
	// Find operations for devices
	const findByHex = async (hex) => {
		try {
			return await Device.findOne({ hex });
		} catch (error) {
			log.error('Error finding device by hex:', error);
			throw error;
		}
	};

	const findByFingerprint = async (fingerprint) => {
		try {
			return await Device.findOne({ fingerprint });
		} catch (error) {
			log.error('Error finding device by fingerprint:', error);
			throw error;
		}
	};

	const findByIp = async (ip) => {
		try {
			return await Device.find({ ip }).sort({ createdAt: -1 });
		} catch (error) {
			log.error('Error finding devices by IP:', error);
			throw error;
		}
	};

	const findMany = async (query = {}, options = {}) => {
		try {
			let mongoQuery = Device.find(query);

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
			log.error('Error finding many devices:', error);
			throw error;
		}
	};

	const findActive = async (limit = 50) => {
		try {
			return await Device.find({ active: true })
				.sort({ 'stats.lastRequestAt': -1 })
				.limit(limit);
		} catch (error) {
			log.error('Error finding active devices:', error);
			throw error;
		}
	};

	const findRecent = async (limit = 50) => {
		try {
			return await Device.find()
				.sort({ createdAt: -1 })
				.limit(limit);
		} catch (error) {
			log.error('Error finding recent devices:', error);
			throw error;
		}
	};

	return { findByHex, findByFingerprint, findByIp, findMany, findActive, findRecent };
};
