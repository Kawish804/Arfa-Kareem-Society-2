const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Standard Auth Routes
router.get('/available-roles', authController.getAvailableRoles);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/activate', authController.activateAccount);
router.get('/status/:email', authController.checkUserStatus);
router.post('/transfer-role', authMiddleware, authController.transferRole);
router.get('/users', authMiddleware, authController.getAllUsers);

// 🟢 THE FIX: ADD THESE NEW FORGOT PASSWORD ROUTES 🟢
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;