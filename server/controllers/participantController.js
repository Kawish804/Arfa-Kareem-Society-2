const Participant = require('../models/Participant');
const Notification = require('../models/Notification'); // 🔴 NEW: Import Notification model
exports.requestParticipation = async (req, res) => {
    try {
        const newParticipant = new Participant({
            ...req.body,
            date: new Date().toISOString().split('T')[0]
        });
        await newParticipant.save();
        res.status(201).json(newParticipant);
    } catch (error) {
        // 🔴 THIS WILL NOW PRINT THE EXACT ERROR IN YOUR VS CODE TERMINAL!
        console.error("🔴 PARTICIPATION SAVE ERROR:", error);
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

// 🔴 UPDATED: Automatically generate Notification on Approve/Reject
exports.updateParticipant = async (req, res) => {
    try {
        const updated = await Participant.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });

        // If the President Approved or Rejected it, send a notification!
        if (req.body.status === 'Approved' || req.body.status === 'Rejected') {
            const newNotif = new Notification({
                title: `Event Participation ${req.body.status}`,
                message: `Your request to join "${updated.eventTitle}" as a ${updated.role} has been ${req.body.status.toLowerCase()}.`,
                type: 'event',
                date: new Date().toLocaleDateString(),
                targetEmail: updated.email // Private message to this student
            });
            await newNotif.save();
        }

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