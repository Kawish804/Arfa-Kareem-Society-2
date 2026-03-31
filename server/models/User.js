const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true,
        // The definitive list of roles
        enum: [
            'President', 'General Secretary', 'Joint GS', 
            'Finance Secretary', 'Assistant Finance', 
            'Event Manager', 'Event Coordinator', 
            'Media PR', 'Co Media', 'CR', 
            'Student', 'Member', 'Visitor'
        ]
    },
    
    // Academic Details (For Students/Members/CRs)
    department: { type: String },
    semester: { type: String },
    rollNo: { type: String },
    timing: { type: String },
    batch: { type: String }, 
    
    reason: { type: String },
    isActive: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    membershipId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);