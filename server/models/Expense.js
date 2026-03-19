// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, default: '' },
    receiptName: { type: String, default: null },
    receiptData: { type: String, default: null }, // Stores base64 string for images/pdfs
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);