// routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const Settings = require('../models/Settings'); // 🔴 Import model for the fee routes

// Existing routes (untouched)
router.get('/', getSettings);
router.put('/update', updateSettings);

// ==========================================
// 🔴 NEW: Specific Routes for Monthly Fee
// ==========================================
router.get('/fee', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.status(200).json({ fee: settings.monthlyFee || 500 });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch fee" });
    }
});

router.put('/fee', async (req, res) => {
    try {
        const { fee } = req.body;
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = await Settings.create({ monthlyFee: Number(fee) });
        } else {
            settings.monthlyFee = Number(fee);
            await settings.save();
        }
        
        res.status(200).json({ fee: settings.monthlyFee });
    } catch (error) {
        res.status(500).json({ error: "Failed to update fee" });
    }
});

module.exports = router;