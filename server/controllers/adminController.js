const User = require('../models/User');
const FundCollection = require('../models/FundCollection');
const Expense = require('../models/Expense');
const Event = require('../models/Event');
const ClassStudent = require('../models/ClassStudent');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); // 🔴 NEW: Needed to securely hash passwords when editing

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

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const membershipId = `AKS-${new Date().getFullYear()}-${randomNum}`;

        user.isApproved = true;
        user.membershipId = membershipId;
        await user.save();

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
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Request rejected and removed." });
    } catch (error) {
        res.status(500).json({ error: "Failed to reject request." });
    }
};

// GET APPROVED MEMBERS
exports.getApprovedMembers = async (req, res) => {
    try {
        const members = await User.find({ isApproved: true, isActive: true }).select('-password');
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch members." });
    }
};

// GET DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Stats
        const totalMembers = await User.countDocuments({ isApproved: true, isActive: true });
        const pendingRequests = await User.countDocuments({ isApproved: false });

        const funds = await FundCollection.find({ status: 'Paid' });
        const totalFunds = funds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

        const expenses = await Expense.find();
        const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Calculate real Active Events 
        const activeEvents = await Event.countDocuments({
            status: { $in: ['Upcoming', 'Ongoing'] }
        });

        // 2. CHART DATA AGGREGATION
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        let fundChart = monthNames.map(month => ({ month, amount: 0 }));
        let expenseChart = monthNames.map(month => ({ month, amount: 0 }));

        funds.forEach(fund => {
            if (fund.date) {
                const date = new Date(fund.date);
                const monthIndex = date.getMonth();
                if (!isNaN(monthIndex)) {
                    fundChart[monthIndex].amount += (Number(fund.amount) || 0);
                }
            }
        });

        expenses.forEach(exp => {
            if (exp.date) {
                const date = new Date(exp.date);
                const monthIndex = date.getMonth();
                if (!isNaN(monthIndex)) {
                    expenseChart[monthIndex].amount += (Number(exp.amount) || 0);
                }
            }
        });

        const currentMonthIndex = new Date().getMonth();
        fundChart = fundChart.slice(0, currentMonthIndex + 1);
        expenseChart = expenseChart.slice(0, currentMonthIndex + 1);

        res.status(200).json({
            stats: {
                totalMembers,
                totalFunds,
                totalExpenses,
                activeEvents,
                pendingRequests,
                chartData: {
                    fundCollection: fundChart,
                    expenses: expenseChart
                }
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

exports.manuallyActivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.isActive = true;
        await user.save();
        res.status(200).json({ message: "Account activated successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Transfer Presidency
exports.transferPresidency = async (req, res) => {
    try {
        const { newPresidentId } = req.params;
        const { currentAdminId } = req.body;

        await User.findByIdAndUpdate(newPresidentId, { role: 'Admin', isApproved: true, isActive: true });
        await User.findByIdAndUpdate(currentAdminId, { role: 'Member' });

        res.status(200).json({ message: "Presidency transferred successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uploadClassList = async (req, res) => {
    try {
        const { students } = req.body; 

        if (!students || students.length === 0) {
            return res.status(400).json({ message: "No students provided." });
        }

        await ClassStudent.insertMany(students);

        res.status(201).json({ message: `${students.length} students uploaded successfully!` });
    } catch (error) {
        res.status(500).json({ error: "Failed to upload class list." });
    }
};

// Admin Views All Class Funds
exports.getAllClassFunds = async (req, res) => {
    try {
        const allStudents = await ClassStudent.find().sort({ department: 1, semester: 1 });
        res.status(200).json(allStudents);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch funds." });
    }
};

// ==========================================
// 🔴 NEW: UPDATE USER (EDIT MEMBER)
// ==========================================
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        let updateData = { ...req.body };

        // If the President typed a new password, we MUST scramble it securely!
        if (updateData.password && updateData.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            // If they left it blank, delete it from the payload so we don't accidentally wipe their current password
            delete updateData.password;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found in database." });
        }

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("🔴 UPDATE USER ERROR:", error);
        res.status(500).json({ message: "Server error while updating user." });
    }
};

// ==========================================
// 🔴 NEW: DELETE USER 
// ==========================================
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found in database." });
        }

        res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("🔴 DELETE USER ERROR:", error);
        res.status(500).json({ message: "Server error while deleting user." });
    }
};