const Message = require('../models/Message');
const User = require('../models/User'); // 🔴 THE FIX: We imported the User model here!

// Get all messages where the logged-in user is either the sender OR receiver
exports.getMyMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const newMessage = await Message.create({
            sender: req.user.id,
            receiver: receiverId,
            text
        });
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
};

// Mark a conversation as read when the user opens it
exports.markAsRead = async (req, res) => {
    try {
        const contactId = req.params.contactId;
        // Find all messages sent BY the contact TO the logged-in user, and mark them read
        await Message.updateMany(
            { sender: contactId, receiver: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update messages" });
    }
};

// Fetches the society directory safely
exports.getChatDirectory = async (req, res) => {
    try {
        const users = await User.find({}).select('fullName email role department class timing');
        res.status(200).json(users);
    } catch (error) {
        console.error("Directory Error:", error);
        res.status(500).json({ error: "Failed to fetch directory" });
    }
};