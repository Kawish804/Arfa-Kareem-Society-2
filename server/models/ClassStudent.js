const mongoose = require('mongoose');

const classStudentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    rollNo: { type: String, required: true },
    department: { type: String, required: true }, // e.g., "Computer Science"
    semester: { type: String, required: true },   // e.g., "8th"
    timing: { type: String, required: true },     // e.g., "Morning"
    fundStatus: { 
        type: String, 
        enum: ['Paid', 'Unpaid'], 
        default: 'Unpaid' 
    }
}, { timestamps: true });

module.exports = mongoose.model('ClassStudent', classStudentSchema);