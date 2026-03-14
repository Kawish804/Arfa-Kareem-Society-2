const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    reason: { type: String, default: '' },
    role: { 
        type: String, 
        enum: ['Admin', 'Finance Head', 'Member'], 
        default: 'Member' 
    },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    membershipId: { type: String, default: null } // <-- THIS WAS MISSING!
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);