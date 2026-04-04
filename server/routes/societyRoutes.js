const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { updateRequestStatus } = require('../controllers/societyController');
const { addRequestReply } = require('../controllers/societyController');    

const {
    createRequest,
    getMyRequests,
    getAllRequests,
    getEvents,
    getAnnouncements
} = require('../controllers/societyController');

// Request Routes
router.post('/requests', authMiddleware, createRequest);
router.get('/requests/my-requests/:email', authMiddleware, getMyRequests);
router.get('/requests/all', authMiddleware, getAllRequests); // President hits this
router.put('/requests/:id/status', authMiddleware, updateRequestStatus);
router.post('/requests/:id/reply', authMiddleware, addRequestReply);
// Events & Announcements Routes
router.get('/events', authMiddleware, getEvents);
router.get('/announcements', authMiddleware, getAnnouncements);

module.exports = router;