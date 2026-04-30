const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true // Speeds up login/signup queries
    },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: [String],
        required: true,
        enum: [
            'President',
            'General Secretary',
            'Finance Head',
            'Assistant Finance Head',
            'Joint General Secretary',
            'Media Manager',
            'Co-Media Manager',
            'Class Representative',
            'Student'
        ]
    },
    department: { type: String },
    semester: { type: String },
    rollNo: { type: String },
    timing: { type: String },
    batch: { type: String },
    reason: { type: String },
    isActive: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    membershipId: { type: String },
    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);