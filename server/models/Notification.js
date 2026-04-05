const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'announcement' }, // announcement, event, request, fund, performance
    date: { type: String, required: true },
    read: { type: Boolean, default: false },
    targetEmail: { type: String, default: null } // 🔴 ADDED: Allows private notifications to specific users
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);