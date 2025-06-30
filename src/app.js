const mongoose = require('mongoose');
const uWs = require('uWebSockets.js');
require('dotenv').config();

const { mongo: { uri, options }, app: { host, port } } = require('./configs');
const services = require('./services');
const { ProxyWebSocket, MetricsWebSocket } = require('./wss');
const { bull: { RequestWorker, MetricsWorker } } = require('./queues');

// Connect to the MongoDB database
mongoose.connect(uri, options).then(r => {
	console.log('Connected to MongoDB');
}).catch(e => {
	console.error('Failed to connect to MongoDB:', e);
});

mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected from MongoDB'));
mongoose.connection.on('reconnected', () => console.log('Mongoose reconnected to MongoDB'));

// Create the WebSocket server without SSL
const app = uWs.App()
	// Listen to the port
	.listen(host, port, (listenSocket) => {
		if (listenSocket) {
			console.log(`Proxy server listening on: ${host}:${port}`);
			console.log('Available endpoints:');
			console.log('  / - Proxy forwarding endpoint');
			console.log('  /metrics - Metrics WebSocket endpoint');
			console.log('  /health - Health check endpoint');
		} else {
			console.error(`Failed to listen to port ${port}`);
		}
	})

// Initialize workers
RequestWorker();
MetricsWorker();

// Initialize WebSocket endpoints
const proxyWs = new ProxyWebSocket(app);
const metricsWs = new MetricsWebSocket(app);

// Register HTTP services (health checks, etc.)
services(app, '');

module.exports = app;
