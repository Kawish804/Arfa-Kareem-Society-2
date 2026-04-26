const ActivityLog = require('../models/ActivityLog');

// Fetch all logs for the frontend
exports.getActivities = async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(500); 
        res.status(200).json(logs);
    } catch (error) {
        // 🔴 THIS WILL PRINT THE EXACT REASON IT FAILED TO YOUR TERMINAL!
        console.error("🔴 GET ACTIVITIES ERROR:", error);
        res.status(500).json({ error: "Failed to fetch activities" });
    }
};

// HELPER FUNCTION: To record actions
exports.logActivity = async (user, role, type, action, ip = null) => {
    try {
        await ActivityLog.create({ user, role, type, action, ip });
    } catch (error) {
        console.error("🔴 Failed to log activity:", error);
    }
};