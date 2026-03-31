const express = require('express');
const router = express.Router();
const { uploadStudents, getAllStudents, getCRClassList, updateFundStatus } = require('../controllers/studentController');

// 1. Import the middleware
const authMiddleware = require('../middleware/authMiddleware');

// 2. Put the middleware IN THE MIDDLE of the route definitions
router.post('/upload', authMiddleware, uploadStudents);
router.get('/all', authMiddleware, getAllStudents);
router.get('/my-class', authMiddleware, getCRClassList); // CR hits this route!
router.put('/:id/fund', authMiddleware, updateFundStatus);

module.exports = router;