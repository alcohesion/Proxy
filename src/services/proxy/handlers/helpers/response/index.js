const getStatusText = require('./status');
module.exports = (res, status, data, contentType = 'application/json') => {
	res.cork(() => {
		res.writeStatus(`${status} ${getStatusText(status)}`)
			.writeHeader('Content-Type', contentType);
		
		if (contentType === 'application/json') {
			res.end(JSON.stringify(data));
		} else {
			res.end(data);
		}
	});
};