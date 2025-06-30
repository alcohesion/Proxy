const mongo = {
	uri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/proxy',
	options: {
		maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE) || 10,
		serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
		socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000
	}
};

// Redis configuration - supports both REDIS_URL and individual config
let redis = {};

if (process.env.REDIS_URL) {
	// Parse REDIS_URL format: redis://[username:password@]host:port[/db]
	try {
		const url = new URL(process.env.REDIS_URL);
		redis = {
			host: url.hostname,
			port: parseInt(url.port) || 6379,
			password: url.password || null,
			db: parseInt(url.pathname.slice(1)) || 0,
			maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
		};
	} catch (error) {
		console.error('Invalid REDIS_URL format:', error.message);
		// Fallback to individual config
		redis = {
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT) || 6379,
			password: process.env.REDIS_PASSWORD || null,
			db: parseInt(process.env.REDIS_DB) || 0,
			maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
		};
	}
} else {
	// Use individual Redis config variables
	redis = {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		password: process.env.REDIS_PASSWORD || null,
		db: parseInt(process.env.REDIS_DB) || 0,
		maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3
	};
}

module.exports = { mongo, redis };
