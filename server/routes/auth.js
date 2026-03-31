const express = require('express');
const router = express.Router();

const {
    signup,
    login,
    activateAccount,
    checkUserStatus,
    getAvailableRoles,
    transferRole
} = require('../controllers/authController');

router.get('/available-roles', getAvailableRoles); // NEW
router.post('/transfer-role', transferRole);       // NEW
router.post('/signup', signup);
router.post('/login', login);
router.post('/activate', activateAccount);
router.get('/status/:email', checkUserStatus);

module.exports = router;