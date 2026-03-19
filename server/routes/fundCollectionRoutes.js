// routes/fundCollectionRoutes.js
const express = require('express');
const router = express.Router();
const { addRecord, getRecords, updateRecord, deleteRecord } = require('../controllers/fundCollectionController');

router.post('/record', addRecord);
router.get('/records', getRecords);
router.put('/record/:id', updateRecord);
router.delete('/record/:id', deleteRecord);

module.exports = router;