const mongoose = require('mongoose');
const { crypto } = require('../utils');

// description This schema represents a proxy request in the system
const request = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	method: { type: String, required: true },
	url: { type: String, required: true },
	path: { type: String, required: true },
	query: { type: mongoose.Schema.Types.Mixed, default: {} },
	headers: { type: mongoose.Schema.Types.Mixed, default: {} },
	body: { type: mongoose.Schema.Types.Mixed, default: null },
	device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
	response: {
		statusCode: { type: Number, default: null },
		headers: { type: mongoose.Schema.Types.Mixed, default: {} },
		body: { type: mongoose.Schema.Types.Mixed, default: null },
		duration: { type: Number, default: null },
		receivedAt: { type: Date, default: null }
	},
	status: { 
		type: String, 
		enum: ['open', 'close', 'unavailable', 'pending', 'forwarded', 'responded', 'timeout', 'error'], 
		default: 'open' 
	},
	error: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

// Middleware to generate hex before validation (since validation happens before save)
request.pre('validate', function(next) {
	try {
		// Generate hex if not already set (for new documents)
		if (this.isNew && !this.hex) {
			this.hex = crypto.request();
		}
		next();
	} catch (error) {
		next(error);
	}
});

// Middleware to update the `updatedAt` timestamp on modification
request.pre('save', function(next) {
	try {
		// Generate hex if not already set (for new documents)
		if (this.isNew && !this.hex) {
			this.hex = crypto.request();
		}
		
		if (this.isModified() && !this.isNew) {
			this.updatedAt = new Date();
		}
		next();
	} catch (error) {
		next(error);
	}
});

request.pre('findOneAndUpdate', function() {
	this.set({ updatedAt: new Date() });
});

// Index for performance
request.index({ createdAt: -1 });
request.index({ status: 1 });
request.index({ device: 1 });

module.exports = request;
