const express = require('express');
const router = express.Router();

router.use('/contacts', require('./contacts'));
router.use('/', require('./auth'));

module.exports = router;