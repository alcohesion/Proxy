const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'Tunnel Monitor',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
