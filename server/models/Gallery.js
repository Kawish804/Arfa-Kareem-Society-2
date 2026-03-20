// models/Gallery.js
const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    url: { type: String, required: true }, // Base64 string of the image
    caption: { type: String, required: true },
    eventId: { type: String, default: '' },
    eventTitle: { type: String, default: 'General' },
    uploadedBy: { type: String, default: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);