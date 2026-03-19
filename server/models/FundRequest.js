// models/FundRequest.js
const mongoose = require('mongoose');

const fundRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    description: { type: String, default: '' },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FundRequest', fundRequestSchema);