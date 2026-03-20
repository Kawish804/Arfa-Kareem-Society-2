// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification } = require('../controllers/notificationController');

router.get('/all', getNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.post('/create', createNotification); // Useful for testing or admin creation

module.exports = router;