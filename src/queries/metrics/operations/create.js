const { Metrics } = require('../../../models');
const { crypto } = require('../../../utils');

// Create a new metrics record
const create = async (data) => {
	try {
		// Ensure hex is generated if not provided
		if (!data.hex) {
			data.hex = crypto.metrics();
		}
		
		const newMetrics = new Metrics(data);
		return await newMetrics.save();
	} catch (error) {
		console.error('Error creating metrics:', error);
		throw error;
	}
};

module.exports = create;
