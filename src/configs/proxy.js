const proxy = {
	timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
	maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
	compression: {
		enabled: process.env.COMPRESSION_ENABLED !== 'false',
		windowBits: parseInt(process.env.COMPRESSION_WINDOW_BITS) || 13,
		memLevel: parseInt(process.env.COMPRESSION_MEM_LEVEL) || 7
	},
	websocket: {
		maxCompressedSize: parseInt(process.env.WS_MAX_COMPRESSED_SIZE) || 65536,
		maxBackpressure: parseInt(process.env.WS_MAX_BACKPRESSURE) || 65536,
		pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000
	},
	metrics: {
		enabled: process.env.METRICS_ENABLED !== 'false',
		retentionDays: parseInt(process.env.METRICS_RETENTION_DAYS) || 7,
		batchSize: parseInt(process.env.METRICS_BATCH_SIZE) || 100
	},
	performance: {
		maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 1000,
		requestRateLimit: parseInt(process.env.REQUEST_RATE_LIMIT) || 100,
		deviceCacheTtl: parseInt(process.env.DEVICE_CACHE_TTL) || 3600
	},
	logging: {
		level: process.env.LOG_LEVEL || 'info',
		format: process.env.LOG_FORMAT || 'json',
		maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
		maxSize: process.env.LOG_MAX_SIZE || '10m'
	},
	development: {
		debugMode: process.env.DEBUG_MODE === 'true',
		mockResponses: process.env.MOCK_RESPONSES === 'true',
		simulateLatency: parseInt(process.env.SIMULATE_LATENCY) || 0
	}
};

module.exports = proxy;
