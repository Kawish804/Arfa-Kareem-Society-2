const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, default: 'N/A' },
    rollNo: { type: String, default: 'N/A' },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    transactionId: { type: String, required: true }, // E.g., TXN-12345678
    status: { type: String, default: 'Completed' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Contribution', contributionSchema);