module.exports = async req => {
  // Extract all request data immediately - don't access req after await
  const requestData = {
    method: req.getMethod().toUpperCase(),
    url: req.getUrl(),
    path: req.getUrl().split('?')[0],
    query: req.getQuery(),
    headers: {}
  };

  // Extract headers immediately
  req.forEach((key, value) => {
    requestData.headers[key] = value;
  });

  return requestData;
};