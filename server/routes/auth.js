const express = require('express');
const router = express.Router();

// 1. Updated Import: Include checkUserStatus in the curly braces
const {
    signup,
    login,
    activateAccount,
    checkUserStatus
} = require('../controllers/authController');

// 2. Define the URL endpoints
router.post('/signup', signup);
router.post('/login', login);
router.post('/activate', activateAccount);

// 3. Fixed Route: Removed "authController." prefix since we imported it directly above
router.get('/status/:email', checkUserStatus);

module.exports = router;