module.exports = async (reqData, device, createQuery, log) => {
  try {
    const requestData = {
      method: reqData.method,
      url: reqData.url,
      path: reqData.path,
      query: reqData.query,
      headers: reqData.headers,
      body: null,
      device: device ? device._id : null,
      status: 'open'
    };

    return await createQuery(requestData);
  } catch (error) {
    log.error('Error creating request:', error);
    return null;
  }
};