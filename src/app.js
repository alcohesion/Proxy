const mongoose = require('mongoose');
const uWs = require('uWebSockets.js');
require('dotenv').config();

const log = require('./logging');
const { mongo: { uri, options }, app: { host, port } } = require('./configs');
const services = require('./services');
const { bull: { RequestWorker, MetricsWorker } } = require('./queues');

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
RequestWorker();
MetricsWorker();

const settings = {
	compression: uWs.SHARED_COMPRESSOR,
	maxPayloadLength: 16 * 1024 * 1024, // 16 MB
	idleTimeout: 0 // Disable idle timeout to prevent auto-disconnect
};

// Register HTTP services (health checks, etc.) with error handling
services(app, settings);

module.exports = app;
