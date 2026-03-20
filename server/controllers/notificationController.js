// controllers/notificationController.js
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifs = await Notification.find().sort({ createdAt: -1 });
        res.status(200).json(notifs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { returnDocument: 'after' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to mark as read" });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ read: false }, { read: true });
        res.status(200).json({ message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update notifications" });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
};

// Optional: A quick route to create notifications from your backend logic later
exports.createNotification = async (req, res) => {
    try {
        const newNotif = new Notification({
            ...req.body,
            date: new Date().toLocaleDateString()
        });
        await newNotif.save();
        res.status(201).json(newNotif);
    } catch (error) {
        res.status(500).json({ error: "Failed to create notification" });
    }
};