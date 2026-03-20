// controllers/announcementController.js
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification'); // <-- NEW: Import the Notification model!

exports.createAnnouncement = async (req, res) => {
    try {
        // 1. Create and save the Announcement
        const newAnn = new Announcement({
            ...req.body,
            postedDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        });
        await newAnn.save();

        // 2. NEW: Automatically trigger a global Notification
        const newNotif = new Notification({
            title: "New Society Announcement",
            message: newAnn.title, // Uses the title of the announcement as the notification message
            type: "announcement",
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        });
        await newNotif.save();

        // 3. Send success response back to frontend
        res.status(201).json(newAnn);
    } catch (error) {
        console.error("Announcement Error:", error);
        res.status(500).json({ error: "Failed to create announcement" });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }); // Newest first
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch announcements" });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update announcement" });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete announcement" });
    }
};  