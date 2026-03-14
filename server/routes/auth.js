const express = require('express');
const router = express.Router();

// This imports the logic from your controller
const { signup, login, activateAccount } = require('../controllers/authController');


// These define the actual URL endpoints: /api/auth/signup and /api/auth/login
router.post('/signup', signup);
router.post('/login', login);
router.post('/activate', activateAccount);

module.exports = router;