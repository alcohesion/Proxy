const proxy = require('./proxy');
const metrics = require('./metrics');
const health = require('./health');

// export all services
module.exports = (app, client) => {
	proxy(app, client);
	metrics(app);
	health(app);
}
