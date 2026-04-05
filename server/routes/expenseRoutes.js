const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');

// 🔴 THE FIX: These paths MUST match the frontend exactly!
router.post('/record', addExpense);       // Matches: POST /api/expenses/record
router.get('/records', getExpenses);      // Matches: GET /api/expenses/records
router.delete('/record/:id', deleteExpense); // Matches: DELETE /api/expenses/record/:id

module.exports = router;