const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'login', 'expense_added', 'fund_collected'
    action: { type: String, required: true }, // e.g., 'Added an expense of Rs 500'
    ip: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);