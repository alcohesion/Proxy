const { device: deviceQueries, request: requestQueries } = require('../queries');

const {
	metrics: { auth, message, connection, interval }
} = require('../handlers');

// Metrics WebSocket endpoint for dashboard
class MetricsWebSocket {
	constructor(app, settings) {
		this.app = app;
		this.connections = new Map();
		this.authenticatedConnections = new Set();
		this.intervals = new Map();
		this.init(app, settings);
	}
	
	init = (app, settings) => {
		// Metrics WebSocket endpoint
		app.ws('/metrics', {
			compression: settings.compression,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 960,
			
			upgrade: async (res, req, context) => {
				try {
					const token = req.getQuery('token');
					const interval = parseInt(req.getQuery('interval')) || 5;
					const userAgent = req.getHeader('user-agent');
					const ip = req.getHeader('x-forwarded-for') || req.getHeader('x-real-ip') || 'unknown';
					
					// Pass connection data to WebSocket
					res.upgrade(
						{ 
							token: token,
							interval: Math.max(1, Math.min(60, interval)), // 1-60 seconds
							userAgent: userAgent,
							ip: ip,
							authenticated: false
						},
						req.getHeader('sec-websocket-key'),
						req.getHeader('sec-websocket-protocol'),
						req.getHeader('sec-websocket-extensions'),
						context
					);
				} catch (error) {
					console.error('Metrics WebSocket upgrade error:', error);
					res.writeStatus('400 Bad Request').end('WebSocket upgrade failed');
				}
			},
			
			open: async (ws) => {
				// Authenticate first
				if (!auth(ws, ws.token)) {
					return;
				}
				
				this.authenticatedConnections.add(ws);
				
				// Handle connection setup
				await connection(ws);
				
				// Start sending metrics at specified interval
				const intervalId = interval(ws, this);
				this.intervals.set(ws.id, intervalId);
			},
			
			message: async (ws, messageData, isBinary) => {
				await message(ws, messageData, isBinary, this);
			},
			
			close: (ws, code, message) => {
				console.log('Metrics WebSocket connection closed');
				this.authenticatedConnections.delete(ws);
				
				// Clear interval
				if (this.intervals.has(ws.id)) {
					clearInterval(this.intervals.get(ws.id));
					this.intervals.delete(ws.id);
				}
			},
			
			drain: (ws) => {
				console.log('Metrics WebSocket backpressure: ' + ws.getBufferedAmount());
			}
		});
	}
	
	// Start sending metrics at regular intervals
	startMetricsInterval(ws) {
		const intervalId = setInterval(async () => {
			if (ws.authenticated) {
				await this.sendMetrics(ws);
				await this.sendSystemStatus(ws);
			}
		}, ws.interval * 1000);
		
		this.intervals.set(ws.id, intervalId);
	}
	
	// Send current metrics
	async sendMetrics(ws) {
		try {
			const now = new Date();
			const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
			const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			
			// Get request statistics
			const [
				totalRequests,
				hourlyRequests,
				dailyRequests,
				successfulRequests,
				failedRequests
			] = await Promise.all([
				requestQueries.count({}),
				requestQueries.count({ timestamp: { $gte: oneHourAgo } }),
				requestQueries.count({ timestamp: { $gte: oneDayAgo } }),
				requestQueries.count({ status: { $gte: 200, $lt: 400 } }),
				requestQueries.count({ $or: [{ status: { $gte: 400 } }, { error: true }] })
			]);
			
			// Get device statistics
			const [totalDevices, activeDevices] = await Promise.all([
				deviceQueries.count({}),
				deviceQueries.count({ lastActive: { $gte: oneHourAgo } })
			]);
			
			// Calculate average response time
			const avgResponseTime = await this.getAverageResponseTime();
			
			ws.send(JSON.stringify({
				type: 'metrics',
				timestamp: new Date().toISOString(),
				data: {
					requests: {
						total: totalRequests,
						hourly: hourlyRequests,
						daily: dailyRequests,
						successful: successfulRequests,
						failed: failedRequests,
						rate: hourlyRequests / 60 // requests per minute
					},
					devices: {
						total: totalDevices,
						active: activeDevices
					},
					performance: {
						avgResponseTime: avgResponseTime
					}
				}
			}));
		} catch (error) {
			console.error('Error sending metrics:', error);
		}
	}
	
	// Send device analytics
	async sendDevices(ws, limit = 50) {
		try {
			const devices = await deviceQueries.findMany({}, {
				limit,
				sort: { lastActive: -1 }
			});
			
			ws.send(JSON.stringify({
				type: 'devices',
				timestamp: new Date().toISOString(),
				data: devices
			}));
		} catch (error) {
			console.error('Error sending devices:', error);
		}
	}
	
	// Send recent requests
	async sendRecentRequests(ws, limit = 50) {
		try {
			const requests = await requestQueries.findMany({}, {
				limit,
				sort: { timestamp: -1 }
			});
			
			ws.send(JSON.stringify({
				type: 'requests',
				timestamp: new Date().toISOString(),
				data: requests
			}));
		} catch (error) {
			console.error('Error sending recent requests:', error);
		}
	}
	
	// Send system status
	async sendSystemStatus(ws) {
		try {
			const memoryUsage = process.memoryUsage();
			const uptime = process.uptime();
			
			ws.send(JSON.stringify({
				type: 'system',
				timestamp: new Date().toISOString(),
				data: {
					uptime: uptime,
					memory: {
						used: memoryUsage.heapUsed,
						total: memoryUsage.heapTotal,
						percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
					},
					connections: {
						metrics: this.authenticatedConnections.size
					}
				}
			}));
		} catch (error) {
			console.error('Error sending system status:', error);
		}
	}
	
	// Calculate average response time
	async getAverageResponseTime() {
		try {
			const result = await requestQueries.aggregate([
				{
					$match: {
						duration: { $exists: true, $ne: null },
						timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
					}
				},
				{
					$group: {
						_id: null,
						avgDuration: { $avg: '$duration' },
						minDuration: { $min: '$duration' },
						maxDuration: { $max: '$duration' }
					}
				}
			]);
			
			if (result && result.length > 0) {
				return {
					avg: Math.round(result[0].avgDuration * 100) / 100,
					min: result[0].minDuration,
					max: result[0].maxDuration
				};
			}
			
			return { avg: 0, min: 0, max: 0 };
		} catch (error) {
			console.error('Error calculating average response time:', error);
			return { avg: 0, min: 0, max: 0 };
		}
	}
	
	// Get connection statistics
	getStats() {
		return {
			total: this.authenticatedConnections.size,
			authenticated: this.authenticatedConnections.size,
			intervals: this.intervals.size
		};
	}
	
	// Broadcast message to all authenticated connections
	broadcast(message) {
		const messageStr = JSON.stringify(message);
		this.authenticatedConnections.forEach(ws => {
			if (ws.authenticated) {
				ws.send(messageStr);
			}
		});
	}
}

module.exports = MetricsWebSocket;
