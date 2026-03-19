// routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');

router.post('/create', createAnnouncement);
router.get('/all', getAnnouncements);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

module.exports = router;