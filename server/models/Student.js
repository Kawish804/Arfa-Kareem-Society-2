const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true }, // e.g., Information Technology
    batch: { type: String, required: true },      // e.g., 2022
    shift: { type: String, required: true },      // e.g., Evening
    fatherName: { type: String },
    semester: { type: String, required: true },   // e.g., 8th
    fundStatus: { 
        type: String, 
        enum: ['Paid', 'Unpaid', 'Pending'], 
        default: 'Unpaid' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);