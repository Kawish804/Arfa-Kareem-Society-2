// controllers/reportController.js
const Report = require('../models/Report');

exports.submitReport = async (req, res) => {
    try {
        const newReport = new Report(req.body);
        await newReport.save();
        res.status(201).json({ message: "Report submitted successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to submit report." });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch reports." });
    }
};