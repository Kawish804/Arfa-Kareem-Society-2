const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    
    // Academic Details (For Students/Members/CRs)
    department: { type: String },
    semester: { type: String },
    rollNo: { type: String },
    timing: { type: String },
    batch: { type: String }, // <--- ADD THIS LINE!
    
    reason: { type: String },
    isActive: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    membershipId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);