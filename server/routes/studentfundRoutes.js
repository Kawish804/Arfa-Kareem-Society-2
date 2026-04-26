const express = require('express');
const router = express.Router();

// 🔴 THE FIX: Point this to the new controller file you just created!
const { getMyClass, updateStudentFund } = require('../controllers/studentFundController'); 

// Note: If you have an auth middleware to get the logged-in user, import it here:
const authMiddleware = require('../middleware/authMiddleware'); // Check your actual middleware path

// Fetch the CR's class and their fund status
router.get('/my-class', authMiddleware, getMyClass);

// Update a specific student's fund status and arrears
router.put('/:id/fund', authMiddleware, updateStudentFund);

module.exports = router;