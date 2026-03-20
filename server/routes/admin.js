const express = require('express');
const router = express.Router();
const {
    getPendingRequests,
    approveRequest,
    rejectRequest,
    getApprovedMembers,
    getDashboardStats,
    manuallyActivateUser,
    transferPresidency
} = require('../controllers/adminController');

router.get('/requests', getPendingRequests);
router.post('/approve/:id', approveRequest);
router.delete('/reject/:id', rejectRequest);
router.get('/members', getApprovedMembers);
router.get('/dashboard-stats', getDashboardStats);
router.put('/users/:id/activate', manuallyActivateUser);
router.put('/users/:newPresidentId/transfer', transferPresidency);

module.exports = router;