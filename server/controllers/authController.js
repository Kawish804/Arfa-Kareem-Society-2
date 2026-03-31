const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ==========================================
// NEW: GET AVAILABLE ROLES
// ==========================================
exports.getAvailableRoles = async (req, res) => {
    try {
        // These roles can only have ONE user
        const singletonRoles = [
            'President', 'General Secretary', 'Joint GS', 
            'Finance Secretary', 'Assistant Finance', 
            'Event Manager', 'Event Coordinator', 
            'Media PR', 'Co Media', 'CR'
        ];
        
        // Find which of these are currently taken
        const takenRoles = await User.distinct('role', { role: { $in: singletonRoles } });
        
        // Filter out the taken ones
        const availableSingletonRoles = singletonRoles.filter(role => !takenRoles.includes(role));
        
        // These roles can have infinite users
        const multipleRoles = ['Student', 'Member', 'Visitor'];

        res.status(200).json([...availableSingletonRoles, ...multipleRoles]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch roles." });
    }
};

// ==========================================
// SIGNUP LOGIC
// ==========================================
exports.signup = async (req, res) => {
    try {
        const { fullName, email, phone, password, role, department, semester, rollNo, timing, batch, reason } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const generatedMembershipId = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            fullName, email, phone, password: hashedPassword, role,
            department, semester, rollNo, timing, batch, reason,
            membershipId: generatedMembershipId, isActive: false, isApproved: false
        });

        await newUser.save();

        try {
            const mailOptions = {
                from: `"Arfa Kareem Society" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Verification Code - Arfa Kareem Society',
                html: `<div style="text-align: center; padding: 20px;"><h2>Welcome to Arfa Kareem Society!</h2><h1>${generatedMembershipId}</h1></div>`
            };
            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: "User created", emailSent: true });
        } catch (emailError) {
            res.status(201).json({ message: "User created, but email failed.", emailSent: false });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error during signup" });
    }
};

// ==========================================
// LOGIN LOGIC (SIMPLIFIED!)
// ==========================================
exports.login = async (req, res) => {
    try {
        // Notice: We NO LONGER check req.body.role! The DB knows who they are.
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password." });

        if (!user.isActive && user.role !== 'President') {
            return res.status(403).json({ message: "Please verify your email or wait for President activation." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, department: user.department, semester: user.semester, timing: user.timing, batch: user.batch },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
};

// ==========================================
// TRANSFER ROLE LOGIC
// ==========================================
exports.transferRole = async (req, res) => {
    try {
        const { currentUserId, targetUserEmail } = req.body;

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findOne({ email: targetUserEmail });

        if (!targetUser) return res.status(404).json({ message: "User with that email not found." });
        
        if (targetUser.role !== 'Student' && targetUser.role !== 'Member') {
            return res.status(400).json({ message: "Target user already holds a leadership position." });
        }

        // Swap roles
        const roleToTransfer = currentUser.role;
        targetUser.role = roleToTransfer;
        currentUser.role = 'Student'; // Demote current user to Student

        await targetUser.save();
        await currentUser.save();

        res.status(200).json({ message: `Successfully transferred ${roleToTransfer} to ${targetUser.fullName}.` });
    } catch (error) {
        res.status(500).json({ error: "Server error during role transfer." });
    }
};

exports.activateAccount = async (req, res) => {
    try {
        const { membershipId, email } = req.body;
        const user = await User.findOne({ membershipId: membershipId.trim() });
        if (!user) return res.status(404).json({ message: "Invalid Membership ID." });
        if (user.email.toLowerCase() !== email.trim().toLowerCase()) return res.status(404).json({ message: "Email mismatch." });
        if (user.isActive) return res.status(400).json({ message: "Account already active." });
        
        user.isActive = true;
        await user.save();
        res.status(200).json({ message: "Account activated." });
    } catch (error) {
        res.status(500).json({ error: "Server error." });
    }
};

exports.checkUserStatus = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ isActive: user.isActive, isApproved: user.isApproved, fullName: user.fullName });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};