const { Metrics } = require('../../../models');

// Find metrics by hex
const findbyhex = async (hex) => {
	try {
		return await Metrics.findOne({ hex });
	} catch (error) {
		console.error('Error finding metrics by hex:', error);
		throw error;
	}
};

module.exports = findbyhex;
