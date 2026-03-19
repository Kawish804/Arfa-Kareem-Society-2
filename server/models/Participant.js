const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    rollNo: { type: String, default: '' },
    department: { type: String, default: '' },
    contact: { type: String, default: '' },
    eventId: { type: String, required: true },
    eventTitle: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, default: 'Pending' }, 
    date: { type: String, required: true },
    teamwork: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    responsibility: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);