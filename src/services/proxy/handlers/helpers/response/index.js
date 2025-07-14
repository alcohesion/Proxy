const getStatusText = require('./status');
module.exports = (res, status, data, contentType = 'application/json') => {
	// Check if response is still valid before accessing it
	if (res.aborted) {
		console.warn(`Cannot send response - response already aborted`);
		return;
	}
	
	try {
		res.cork(() => {
			res.writeStatus(`${status} ${getStatusText(status)}`)
				.writeHeader('Content-Type', contentType);
			
			if (contentType === 'application/json') {
				res.end(JSON.stringify(data));
			} else {
				res.end(data);
			}
		});
	} catch (error) {
		console.warn(`Cannot send response: ${error.message}`);
	}
};