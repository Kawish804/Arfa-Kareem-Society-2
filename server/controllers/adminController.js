const User = require('../models/User');
const nodemailer = require('nodemailer');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// GET PENDING REQUESTS
exports.getPendingRequests = async (req, res) => {
    try {
        // Find all users who are not approved yet
        const pendingUsers = await User.find({ isApproved: false }).select('-password');
        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch requests" });
    }
};

// APPROVE REQUEST & SEND EMAIL
exports.approveRequest = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate a Membership ID (e.g., AKS-2026-1234)
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const membershipId = `AKS-${new Date().getFullYear()}-${randomNum}`;

        user.isApproved = true;
        user.membershipId = membershipId;
        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Arfa Kareem Society - Membership Approved!',
            html: `
                <h2>Welcome to Arfa Kareem Society!</h2>
                <p>Dear ${user.fullName},</p>
                <p>Your membership request has been approved by the Admin.</p>
                <p><strong>Your Official Membership ID:</strong> ${membershipId}</p>
                <p>You can now log in to the portal using your email and password.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Approved successfully and email sent!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to approve request." });
    }
};

// REJECT REQUEST
exports.rejectRequest = async (req, res) => {
    try {
        // Delete the user from the database if rejected
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Request rejected and removed." });
    } catch (error) {
        res.status(500).json({ error: "Failed to reject request." });
    }
};
exports.getApprovedMembers = async (req, res) => {
    try {
        // Now it ONLY fetches users who have completed the final signup step
        const members = await User.find({ isApproved: true, isActive: true }).select('-password');
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch members." });
    }
};