const express = require('express');
const router = express.Router();
const { recordContribution } = require('../controllers/contributionController');

// The route will be /api/contributions/record
router.post('/record', recordContribution);

module.exports = router;