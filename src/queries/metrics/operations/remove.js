module.exports = Metrics => {
	// Delete metrics by hex
	const deletebyhex = async (hex) => {
		try {
			return await Metrics.findOneAndDelete({ hex });
		} catch (error) {
			console.error('Error deleting metrics by hex:', error);
			throw error;
		}
	};

	return { deletebyhex };
};
