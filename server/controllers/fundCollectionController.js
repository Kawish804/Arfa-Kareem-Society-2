// controllers/fundCollectionController.js
const FundCollection = require('../models/FundCollection');

exports.addRecord = async (req, res) => {
    try {
        const newRecord = new FundCollection(req.body);
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ error: "Failed to add record." });
    }
};

exports.getRecords = async (req, res) => {
    try {
        const records = await FundCollection.find().sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch records." });
    }
};

exports.updateRecord = async (req, res) => {
    try {
        const updatedRecord = await FundCollection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedRecord);
    } catch (error) {
        res.status(500).json({ error: "Failed to update record." });
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        await FundCollection.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Record deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete record." });
    }
};