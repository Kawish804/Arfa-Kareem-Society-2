// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, default: 'Seminar' },
    date: { type: String, required: true },
    time: { type: String, default: '' },
    endDate: { type: String, default: '' },
    venue: { type: String, default: '' },
    description: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], default: 'Upcoming' },
    maxParticipants: { type: Number, default: 0 },
    organizer: { type: String, default: '' },
    department: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    registrationDeadline: { type: String, default: '' },
    eligibility: { type: String, default: 'All Students' },
    entryFee: { type: Number, default: 0 },
    chiefGuest: { type: String, default: '' },
    requirements: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);