// models/FundCollection.js
const mongoose = require('mongoose');

const fundCollectionSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    rollNo: { type: String, default: '' }, // <-- ADDED BACK!
    department: { type: String, default: 'BS-IT' }, 
    semester: { type: String, default: '1st' }, 
    timing: { type: String, default: 'Morning' },
    amount: { type: Number, required: true },
    date: { type: String, default: '' },
    status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    method: { type: String, default: '' },
    receiptName: { type: String, default: null },
    receiptData: { type: String, default: null }, 
    uploadedBy: { type: String, default: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('FundCollection', fundCollectionSchema);