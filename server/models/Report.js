// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, default: '' },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'Unread' } // Can be Unread, Reviewed, or Resolved
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);