// controllers/settingsController.js
const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        // Find the first settings document. If it doesn't exist, create a default one.
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        // Update the single settings document (upsert creates it if it's missing)
        const updated = await Settings.findOneAndUpdate({}, req.body, { 
            new: true, 
            upsert: true,
            returnDocument: 'after' 
        });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update settings" });
    }
};