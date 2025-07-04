// Set up initial abort handler
const setupInitialAbortHandler = (res, log) => {
	let aborted = false;
	res.onAborted(() => {
		aborted = true;
		log.warn('Proxy request aborted');
	});
	return { aborted: () => aborted };
};

module.exports = { setupInitialAbortHandler };
