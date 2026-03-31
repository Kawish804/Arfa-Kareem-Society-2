const express = require('express');
const router = express.Router();

// Import the controller you already created!
const { addExpense, getExpenses, deleteExpense } = require('../controllers/expenseController');

// Route mapping:
// POST http://localhost:5000/api/expenses
router.post('/', addExpense);

// GET http://localhost:5000/api/expenses
router.get('/', getExpenses);

// DELETE http://localhost:5000/api/expenses/:id
router.delete('/:id', deleteExpense);

module.exports = router;