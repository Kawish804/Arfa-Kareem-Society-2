const express = require('express');
const router = express.Router();
const { getPendingRequests, approveRequest, rejectRequest, getApprovedMembers } = require('../controllers/adminController');

router.get('/requests', getPendingRequests);
router.post('/approve/:id', approveRequest);
router.delete('/reject/:id', rejectRequest);
router.get('/members', getApprovedMembers);

module.exports = router;