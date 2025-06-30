const proxy = require('./proxy');
const metrics = require('./metrics');
const health = require('./health');

// export all services
module.exports = (app, api) => {
	proxy(app, api);
	metrics(app, api);
	health(app, api);
}
