const http = require('http');
const https = require('https');
const { proxy } = require('../../configs');

// HTTP request forwarding utility for WebSocket proxy
const forward = async ({ method, path, headers, body }) => {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: proxy.targetHost,
			port: proxy.targetPort,
			path: path,
			method: method.toUpperCase(),
			headers: {
				...headers,
				'Host': `${proxy.targetHost}:${proxy.targetPort}`
			},
			timeout: proxy.timeout || 30000
		};

		const protocol = proxy.targetProtocol === 'https' ? https : http;
		
		const req = protocol.request(options, (res) => {
			let responseBody = '';
			
			res.on('data', (chunk) => {
				responseBody += chunk;
			});
			
			res.on('end', () => {
				resolve({
					statusCode: res.statusCode,
					headers: res.headers,
					body: responseBody
				});
			});
		});
		
		req.on('error', (error) => {
			reject(error);
		});
		
		req.on('timeout', () => {
			req.destroy();
			reject(new Error('Request timeout'));
		});
		
		if (body && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put' || method.toLowerCase() === 'patch')) {
			req.write(body);
		}
		
		req.end();
	});
};

module.exports = forward;
