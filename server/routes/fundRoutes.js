// routes/fundRoutes.js
const express = require('express');
const router = express.Router();
const { submitRequest, getRequests, updateStatus } = require('../controllers/fundController');

router.post('/request', submitRequest);
router.get('/requests', getRequests);
router.put('/requests/:id', updateStatus);

module.exports = router;