const mongoose = require('mongoose');

const studentFundSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    rollNumber: { type: String },
    department: { type: String },
    shift: { type: String },
    semester: { type: String },
    fundStatus: { type: String, default: 'Pending' }, // 'Paid', 'Pending', 'Unpaid'
    arrears: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('StudentFund', studentFundSchema);