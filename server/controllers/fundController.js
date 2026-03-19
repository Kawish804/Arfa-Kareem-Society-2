// controllers/fundController.js
const FundRequest = require('../models/FundRequest');

// STUDENT: Submit a new fund appeal
exports.submitRequest = async (req, res) => {
    try {
        const { name, email, amount, purpose, description } = req.body;
        const newRequest = new FundRequest({ name, email, amount, purpose, description });

        await newRequest.save();
        res.status(201).json({ message: "Fund appeal submitted successfully!" });
    } catch (error) {
        console.error("Error submitting fund request:", error);
        res.status(500).json({ error: "Failed to submit request." });
    }
};

// ADMIN: Get all fund requests
exports.getRequests = async (req, res) => {
    try {
        const requests = await FundRequest.find().sort({ createdAt: -1 }); // Newest first
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch fund requests." });
    }
};

// ADMIN: Approve or Reject a request
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        const request = await FundRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!request) return res.status(404).json({ message: "Request not found" });
        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ error: "Failed to update status." });
    }
};
// DELETE a fund request
exports.deleteFundRequest = async (req, res) => {
    try {
        const deletedRequest = await FundRequest.findByIdAndDelete(req.params.id);
        if (!deletedRequest) return res.status(404).json({ message: "Request not found" });
        res.status(200).json({ message: "Request deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete request" });
    }
};