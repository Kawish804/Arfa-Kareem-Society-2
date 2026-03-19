// routes/fundRoutes.js
const express = require('express');
const router = express.Router();

// 1. Added deleteFundRequest to your imports
const { 
    submitRequest, 
    getRequests, 
    updateStatus, 
    deleteFundRequest 
} = require('../controllers/fundController');

// 2. Existing routes
router.post('/request', submitRequest);
router.get('/requests', getRequests);
router.put('/requests/:id', updateStatus);

// 3. NEW: Delete route
router.delete('/requests/:id', deleteFundRequest);

module.exports = router;