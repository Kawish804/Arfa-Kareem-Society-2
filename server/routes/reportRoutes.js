// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { submitReport, getReports } = require('../controllers/reportController');

router.post('/submit', submitReport);
router.get('/all', getReports); // For when we build the admin report viewer later!

module.exports = router;