const mongoose = require('mongoose');
const { crypto } = require('../utils');

// Get retention period from environment (default 7 days)
const retentionDays = parseInt(process.env.METRICS_RETENTION_DAYS) || 7;
const retentionSeconds = retentionDays * 24 * 60 * 60;

// description This schema represents metrics data for dashboard
const metrics = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	type: { 
		type: String, 
		enum: ['request', 'response', 'error', 'connection', 'performance'], 
		required: true 
	},
	data: { type: mongoose.Schema.Types.Mixed, required: true },
	request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
	device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
	tags: [{ type: String }],
	timestamp: { type: Date, default: Date.now },
	processed: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now }
});

// Middleware to generate hex for new documents
metrics.pre('save', function(next) {
	// Generate hex if not already set (for new documents)
	if (this.isNew && !this.hex) {
		this.hex = crypto.metrics();
	}
	next();
});

// TTL index to auto-delete old metrics based on environment configuration
metrics.index({ createdAt: 1 }, { expireAfterSeconds: retentionSeconds });

// Index for performance
metrics.index({ type: 1 });
metrics.index({ timestamp: -1 });
metrics.index({ processed: 1 });
metrics.index({ request: 1 });
metrics.index({ device: 1 });

module.exports = metrics;
