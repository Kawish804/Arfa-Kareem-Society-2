// controllers/eventController.js
const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: "Failed to create event." });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }); // Sort by date ascending
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events." });
    }
};
exports.updateEvent = async (req, res) => {
    try {
        // Updated the options object here!
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: "Failed to update event." });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Event deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete event." });
    }
};