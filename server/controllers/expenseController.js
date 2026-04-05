// controllers/expenseController.js
const Expense = require('../models/Expense');

exports.addExpense = async (req, res) => {
    try {
        const newExpense = new Expense(req.body);
        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        // 🔴 THIS WILL NOW PRINT THE EXACT ERROR IN YOUR TERMINAL!
        console.error("🔴 ERROR SAVING EXPENSE:", error); 
        res.status(500).json({ error: "Failed to add expense." });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ createdAt: -1 }); // Newest first
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expenses." });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Expense deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete expense." });
    }
};