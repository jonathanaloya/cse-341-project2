const express = require('express');
const router = express.Router();

router.use('/contacts', require('./contacts'));
router.use('/auth', require('./auth'));

module.exports = router;