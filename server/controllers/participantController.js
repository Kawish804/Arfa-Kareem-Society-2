// controllers/participantController.js
const Participant = require('../models/Participant');

exports.requestParticipation = async (req, res) => {
    try {
        const newParticipant = new Participant({
            ...req.body,
            date: new Date().toISOString().split('T')[0]
        });
        await newParticipant.save();
        res.status(201).json(newParticipant);
    } catch (error) {
        res.status(500).json({ error: "Failed to submit request" });
    }
};

exports.getParticipants = async (req, res) => {
    try {
        const participants = await Participant.find().sort({ createdAt: -1 });
        res.status(200).json(participants);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch participants" });
    }
};

exports.updateParticipant = async (req, res) => {
    try {
        const updated = await Participant.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update participant" });
    }
};

exports.deleteParticipant = async (req, res) => {
    try {
        await Participant.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
};