// models/Settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    societyName: { type: String, default: 'Arfa Kareem Society' },
    university: { type: String, default: 'University of Education' },
    email: { type: String, default: 'info@arfakareem.edu' },
    phone: { type: String, default: '+92-300-1234567' },
    notifications: {
        email: { type: Boolean, default: true },
        events: { type: Boolean, default: true },
        funds: { type: Boolean, default: false },
        announcements: { type: Boolean, default: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);