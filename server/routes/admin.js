const express = require('express');
const router = express.Router();
const {
    getPendingRequests,
    approveRequest,
    rejectRequest,
    getApprovedMembers,
    getDashboardStats,
    manuallyActivateUser,
    transferPresidency,
    updateUser,
    deleteUser 
} = require('../controllers/adminController');

// Existing Routes
router.get('/requests', getPendingRequests);
router.post('/approve/:id', approveRequest);
router.delete('/reject/:id', rejectRequest);
router.get('/members', getApprovedMembers);
router.get('/dashboard-stats', getDashboardStats);
router.put('/users/:id/activate', manuallyActivateUser);
router.put('/users/:newPresidentId/transfer', transferPresidency);

// 🔴 NEW ROUTES FOR EDITING AND DELETING MEMBERS
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;