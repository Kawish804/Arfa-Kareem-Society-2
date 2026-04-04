const Request = require('../models/Request');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');


// --- REQUESTS ---
exports.createRequest = async (req, res) => {
    try {
        const newRequest = new Request(req.body);
        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create request" });
    }
};

// For the CR (Only sees their own requests)
exports.getMyRequests = async (req, res) => {
    try {
        const email = req.params.email;
        const requests = await Request.find({ email: email }).sort({ createdAt: -1 }); 
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
    }
};

// For the President (Sees ALL requests)
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 }); 
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
    }
};

// --- EVENTS & ANNOUNCEMENTS ---
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events" });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch announcements" });
    }
};
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { returnDocument: 'after' }
        );
        
        if (!updatedRequest) return res.status(404).json({ error: "Request not found" });
        res.status(200).json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: "Failed to update status" });
    }
};
exports.addRequestReply = async (req, res) => {
    try {
        const { text, from } = req.body;
        const newReply = {
            from,
            text,
            date: new Date().toLocaleDateString('en-PK'),
            time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        };

        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id,
            { $push: { replies: newReply } },
            { returnDocument: 'after' }
        );

        res.status(200).json(updatedRequest);
    } catch (error) {
        res.status(500).json({ error: "Failed to add reply" });
    }
};