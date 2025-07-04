// Handle request body reading based on HTTP method
const readRequestBody = (res, request, processCallback) => {
	if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'DELETE') {
		// For methods that typically don't have a body, process immediately
		processCallback('');
	} else {
		// For methods that might have a body, read it first
		let body = '';
		res.onData(async (chunk, isLast) => {
			body += Buffer.from(chunk).toString();
			if (isLast) {
				await processCallback(body);
			}
		});
	}
};

module.exports = { readRequestBody };
