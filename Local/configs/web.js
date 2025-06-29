const express = require('express');
const path = require('path');

function setupWeb() {
  const app = express();
  
  // Set view engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  
  // Static files with proper MIME types
  app.use('/static', express.static(path.join(__dirname, '..', 'static'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  
  // Routes
  const indexRouter = require('../routes/index');
  app.use('/', indexRouter);
  
  return app;
}

module.exports = { setupWeb };
