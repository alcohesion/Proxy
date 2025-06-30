const mongo = {
	uri: process.env.MONGO_URI || 'mongodb://localhost:27017/proxy',
	options: {
		maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
		serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
		socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000
	}
};

const redis = {
	host: process.env.REDIS_HOST || 'localhost',
	port: parseInt(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASSWORD || null,
	db: parseInt(process.env.REDIS_DB) || 0,
	maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
};

module.exports = { mongo, redis };
