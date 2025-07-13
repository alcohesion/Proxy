// Protocol configuration for tunnel messages
const packageJson = require('../package.json');

const protocol = {
	version: packageJson.version, // Only place that reads version from package.json
	priority: {
		default: 'normal',
		values: ['low', 'normal', 'high', 'critical']
	},
	deliveryMode: {
		default: 'at_least_once',
		values: ['fire_and_forget', 'at_most_once', 'at_least_once', 'exactly_once']
	},
	encoding: {
		default: 'json',
		values: ['json', 'binary', 'compressed']
	}
};

module.exports = { protocol };
