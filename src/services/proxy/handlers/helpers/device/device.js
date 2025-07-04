const createRequest = require('./request')
module.exports = async (requestData, query, log) => {
  // Extract device info immediately
  const deviceInfo = {
    ip: requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown',
    userAgent: requestData.headers['user-agent'] || null,
    fingerprint: Buffer.from(`${requestData.headers['x-forwarded-for'] || requestData.headers['x-real-ip'] || 'unknown'}${requestData.headers['user-agent'] || ''}`).toString('base64'),
    connection: {
      protocol: requestData.headers['x-forwarded-proto'] || 'http',
      secure: requestData.headers['x-forwarded-proto'] === 'https'
    }
  };

  // Now we can safely do async operations
  const device = await query.device(deviceInfo);
  const request = await createRequest(requestData, device, query.request, log);

  // Log request creation with hex ID
  if (request) log.proxy(`Request created - Method: ${requestData.method}, Path: ${requestData.path}, RequestID: ${request.hex}`);

  return { request, device }
}