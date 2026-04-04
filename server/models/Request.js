const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String },
    submittedBy: { type: String, required: true }, 
    email: { type: String, required: true },       
    role: { type: String, default: 'Student' }, // 🔴 NEW
    status: { type: String, default: 'Pending' },
    replies: [{ // 🔴 NEW
        from: String,
        text: String,
        date: String,
        time: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);