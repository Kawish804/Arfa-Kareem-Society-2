const express = require('express');
const router = express.Router();

// 1. Import all the functions from the controller
const {
    uploadStudents,
    getAllStudents,
    getCRClassList,
    updateFundStatus,
    updateStudent,    // 🔴 NEW: For Editing
    deleteStudent     // 🔴 NEW: For Deleting
} = require('../controllers/studentController');

// 2. Import the middleware
const authMiddleware = require('../middleware/authMiddleware');

// 3. Put the middleware IN THE MIDDLE of the route definitions
router.post('/upload', authMiddleware, uploadStudents);
router.get('/all', authMiddleware, getAllStudents);
router.get('/my-class', authMiddleware, getCRClassList); // CR hits this route!
router.put('/:id/fund', authMiddleware, updateFundStatus);

// 🔴 NEW CRUD ROUTES FOR PRESIDENT
router.put('/:id', authMiddleware, updateStudent);
router.delete('/:id', authMiddleware, deleteStudent);

module.exports = router;