
// routes/participantRoutes.js
const express = require('express');
const router = express.Router();
const { requestParticipation, getParticipants, updateParticipant, deleteParticipant } = require('../controllers/participantController');

router.post('/request', requestParticipation);
router.get('/all', getParticipants);
router.put('/:id', updateParticipant);
router.delete('/:id', deleteParticipant);

module.exports = router;