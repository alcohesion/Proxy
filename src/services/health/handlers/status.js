const { Request, Device } = require('../../../models');

module.exports = (app, api) => {
	app.get('/health', (res, req) => {
		res.writeHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			uptime: `${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s`,
			memory: {
				rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
				heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
			}
		}));
	});

	app.get('/status', async (res, req) => {
		try {
			const [totalRequests, totalDevices, activeDevices] = await Promise.all([
				Request.countDocuments(),
				Device.countDocuments(),
				Device.countDocuments({ active: true })
			]);

			res.writeHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({
				proxy: 'running',
				database: 'connected',
				stats: {
					totalRequests,
					totalDevices,
					activeDevices
				},
				uptime: process.uptime(),
				timestamp: new Date().toISOString()
			}));
		} catch (error) {
			res.writeStatus('500 Internal Server Error');
			res.writeHeader('Content-Type', 'application/json');
			res.end(JSON.stringify({
				error: 'Database connection failed',
				timestamp: new Date().toISOString()
			}));
		}
	});
};
