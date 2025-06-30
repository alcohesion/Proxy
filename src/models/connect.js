const connect = (mongoose, uri, options) => {
	return new Promise((resolve, reject) => {
		mongoose.connect(uri, options)
			.then(() => resolve(mongoose))
			.catch(err => reject(err));
	});
};

module.exports = connect;
