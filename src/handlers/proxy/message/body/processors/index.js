// Body processors index
const processText = require('./text');
const processHtml = require('./html');
const processJson = require('./json');
const processBinary = require('./binary');
const processXml = require('./xml');

module.exports = {
	text: processText,
	html: processHtml,
	json: processJson,
	binary: processBinary,
	xml: processXml
};
