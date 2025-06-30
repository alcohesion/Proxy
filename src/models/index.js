const mongoose = require('mongoose');
const log = require('../logging');
const connect = require('./connect');
const { mongo: { uri, options } } = require('../configs');
const request = require('./request');
const device = require('./device');
const metrics = require('./metrics');

const Request = mongoose.model('Request', request);
const Device = mongoose.model('Device', device);
const Metrics = mongoose.model('Metrics', metrics);

connect(mongoose, uri, options).then(() => log.mongo('mongo connect'))

/* Export all models */
module.exports = { Request, Device, Metrics };
