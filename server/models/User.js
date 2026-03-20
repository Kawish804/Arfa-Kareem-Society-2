const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    
    // --- NEW FIELDS ---
    rollNo: { type: String, required: true },
    timing: { type: String, enum: ['Morning', 'Evening'], required: true },
    
    reason: { type: String, default: '' },
    role: { 
        type: String, 
        enum: ['Admin', 'CR', 'Finance Manager', 'Student', 'Member', 'Event Coordinator', 'Visitor'], 
        default: 'Student' 
    },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    membershipId: { type: String, default: null }
}, { timestamps: true });

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function() {
    // If the password hasn't been changed, just stop and return
    if (!this.isModified('password')) return;
    
    // Otherwise, hash it!
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);