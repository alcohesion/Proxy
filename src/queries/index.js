const request = require('./request');
const device = require('./device');
const metrics = require('./metrics');
const { Request, Metrics, Device } = require('../models');
const log = require('../logging');

module.exports = {
	request: request(Request, log),
	device: device(Device, log),
	metrics: metrics(Metrics, log)
};
