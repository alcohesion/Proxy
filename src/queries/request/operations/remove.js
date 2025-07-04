module.exports = (Request, log) => {
	// Delete request by hex
	const deletebyhex = async (hex) => {
		try {
			return await Request.findOneAndDelete({ hex });
		} catch (error) {
			log.error('Error deleting request by hex:', error);
			throw error;
		}
	};

	return { deletebyhex };
};
