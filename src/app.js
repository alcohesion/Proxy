const mongoose = require('mongoose');
const uWs = require('uWebSockets.js');
require('dotenv').config();

const log = require('./logging');
const { mongo: { uri, options }, app: { host, port } } = require('./configs');
const services = require('./services');
const { ProxyWebSocket, MetricsWebSocket } = require('./wss');
const { bull: { RequestWorker, MetricsWorker } } = require('./queues');
const { ClientManager, metrics: { setMetricsWebSocket } } = require('./utils');

// Global error handlers
process.on('uncaughtException', (error) => {
	log.error('Uncaught Exception:', error);
	// Don't exit immediately, give time for logging
	setTimeout(() => {
		process.exit(1);
	}, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
	log.error('Unhandled Rejection at:', promise);
	log.error('Reason:', reason);
	// Don't exit on unhandled rejections, just log them
});

// Log startup information
log.info('Starting Proxy Server application...');
log.info('Node.js version:', process.version);
log.info('Platform:', process.platform);
log.info('Architecture:', process.arch);
log.info('Environment:', process.env.NODE_ENV);
log.info('Working directory:', process.cwd());

// Connect to the MongoDB database
mongoose.connect(uri, options).then(r => {
	log.mongo('Connected to MongoDB');
}).catch(e => {
	log.mongo('Failed to connect to MongoDB:', e);
	log.warn('Continuing without MongoDB connection...');
});

mongoose.connection.on('connected', () => log.mongo('Mongoose connected to MongoDB'));
mongoose.connection.on('error', (err) => log.mongo('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => log.mongo('Mongoose disconnected from MongoDB'));
mongoose.connection.on('reconnected', () => log.mongo('Mongoose reconnected to MongoDB'));

// Create client manager
const client = new ClientManager();

// Create the WebSocket server without SSL
const app = uWs.App()
	// Listen to the port
	.listen(host, port, (listenSocket) => {
		if (listenSocket) {
			log.success(`Proxy server listening on: ${host}:${port}`);
			log.info('Available endpoints:');
			log.info('/ - Proxy forwarding endpoint');
			log.info('/metrics - Metrics WebSocket endpoint');
			log.info('/health - Health check endpoint');
		} else {
			log.error(`Failed to listen to port ${port}`);
			process.exit(1);
		}
	})

// Initialize workers with error handling
try {
	RequestWorker();
	MetricsWorker();
	log.worker('Workers initialized');
} catch (error) {
	log.worker('Failed to initialize workers:', error);
	log.warn('Continuing without queue workers...');
}

// Initialize WebSocket endpoints with error handling
try {
	const settings = {
		compression: uWs.SHARED_COMPRESSOR,
		maxPayloadLength: 16 * 1024 * 1024, // 16 MB
		idleTimeout: 960 // 16 minutes
	};
	const proxyWs = new ProxyWebSocket(app, client, settings);
	const metricsWs = new MetricsWebSocket(app, settings);

	// Set metrics WebSocket instance for broadcasting
	setMetricsWebSocket(metricsWs);
	
	log.wss('WebSocket endpoints initialized');
} catch (error) {
	log.wss('Failed to initialize WebSocket endpoints:', error);
}

// Register HTTP services (health checks, etc.) with error handling
try {
	services(app, client);
	log.success('HTTP services registered');
} catch (error) {
	log.error('Failed to register HTTP services:', error);
}

module.exports = app;
