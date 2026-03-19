// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { createEvent, getEvents, updateEvent, deleteEvent } = require('../controllers/eventController');

router.post('/record', createEvent);
router.get('/records', getEvents);
router.put('/record/:id', updateEvent);
router.delete('/record/:id', deleteEvent);

module.exports = router;