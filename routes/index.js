const express = require('express');
const router = express.Router();

const privateRoutes = require('./privateRoutes');
const catwayRoutes = require('./catwayRoutes');

router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

router.use('/privates', privateRoutes);
router.use('/catways', catwayRoutes);

module.exports = router;