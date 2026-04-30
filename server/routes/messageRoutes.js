const express = require('express');
const router = express.Router();
const { getMyMessages, sendMessage, markAsRead, getChatDirectory } = require('../controllers/messageController');

// 🔴 IMPORTANT: Replace 'authMiddleware' with whatever your token verifier is named!
const authMiddleware = require('../middleware/authMiddleware'); // Adjust this path if needed

router.get('/my-messages', authMiddleware, getMyMessages);
router.post('/send', authMiddleware, sendMessage);
router.put('/mark-read/:contactId', authMiddleware, markAsRead);
router.get('/directory', authMiddleware, getChatDirectory);

module.exports = router;