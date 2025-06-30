const { Metrics, Request, Device } = require('../../models');
const { metrics: metricsQuery, request: requestQuery, device: deviceQuery } = require('../../queries');
const { proxy } = require('../../configs');

const connectedDashboards = new Set();

const broadcastToMetrics = (data) => {
	const message = JSON.stringify(data);
	connectedDashboards.forEach(ws => {
		if (ws.readyState === 1) { // OPEN
			ws.send(message);
		}
	});
};

module.exports = (app, api) => {
	app.ws('/metrics', {
		compression: proxy.compression.enabled ? 1 : 0,
		maxCompressedSize: proxy.websocket.maxCompressedSize,
		maxBackpressure: proxy.websocket.maxBackpressure,
		
		message: async (ws, message, opCode) => {
			try {
				const data = JSON.parse(Buffer.from(message).toString());
				
				// Handle dashboard requests
				if (data.type === 'get_stats') {
					const [totalRequests, totalDevices, activeDevices] = await Promise.all([
						requestQuery.countTotal(),
						deviceQuery.countTotal(),
						deviceQuery.countByStatus(true)
					]);
					
					ws.send(JSON.stringify({
						type: 'stats',
						data: {
							totalRequests,
							totalDevices,
							activeDevices,
							timestamp: new Date().toISOString()
						}
					}));
				}
				
				if (data.type === 'get_recent_requests') {
					const limit = data.limit || 50;
					const requests = await requestQuery.findRecent(limit);
					
					ws.send(JSON.stringify({
						type: 'recent_requests',
						data: requests
					}));
				}
				
				if (data.type === 'get_metrics') {
					const timeframe = data.timeframe || '1h';
					const now = new Date();
					let since;
					
					switch (timeframe) {
						case '1h': since = new Date(now.getTime() - 60 * 60 * 1000); break;
						case '24h': since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
						case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
						default: since = new Date(now.getTime() - 60 * 60 * 1000);
					}
					
					const metrics = await metricsQuery.findByTimeRange(since, now, null, 500);
					
					ws.send(JSON.stringify({
						type: 'metrics',
						timeframe,
						data: metrics
					}));
				}
				
			} catch (error) {
				console.error('Error handling metrics WebSocket message:', error);
				ws.send(JSON.stringify({
					type: 'error',
					message: 'Failed to process request'
				}));
			}
		},
		
		open: (ws) => {
			connectedDashboards.add(ws);
			console.log('Dashboard connected to metrics endpoint');
			
			ws.send(JSON.stringify({
				type: 'welcome',
				message: 'Connected to Metrics WebSocket',
				timestamp: new Date().toISOString()
			}));
		},
		
		close: (ws, code, message) => {
			connectedDashboards.delete(ws);
			console.log('Dashboard disconnected from metrics endpoint');
		}
	});
};

// Export for use in queues
module.exports.broadcastToMetrics = broadcastToMetrics;
