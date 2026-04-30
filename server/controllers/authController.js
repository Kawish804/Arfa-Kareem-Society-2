const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Much safer than Math.random()

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
// GET AVAILABLE ROLES
// ==========================================
exports.getAvailableRoles = async (req, res) => {
    try {
        const singletonRoles = [
            'President', 'General Secretary', 'Finance Head', 'Assistant Finance Head',
            'Joint General Secretary', 'Media Manager', 'Co-Media Manager'
        ];

        // ENTERPRISE FIX: Only consider a role "taken" if the user is actually approved by an admin.
        const takenRoles = await User.distinct('role', { 
            role: { $in: singletonRoles },
            isApproved: true 
        });

        const availableSingletonRoles = singletonRoles.filter(role => !takenRoles.includes(role));
        const multipleRoles = ['Class Representative', 'Student'];

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

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) return res.status(400).json({ message: "User already exists with this email." });

        const newRoles = Array.isArray(role) ? role : [role];

        if (newRoles.includes('Class Representative')) {
            const existingCR = await User.findOne({
                role: 'Class Representative', department, batch, semester, timing, isApproved: true
            });
            if (existingCR) {
                return res.status(400).json({ message: `A Class Representative already exists for ${department} ${semester} (${timing} timing).` });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // ENTERPRISE FIX: Cryptographically secure random number
        const generatedMembershipId = crypto.randomInt(100000, 999999).toString();

        const newUser = new User({
            fullName, email, phone, password: hashedPassword, 
            role: newRoles, department, semester, rollNo, timing, batch, reason,
            membershipId: generatedMembershipId, isActive: false, isApproved: false
        });

        await newUser.save();

        try {
            await transporter.sendMail({
                from: `"Arfa Kareem Society" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Verification Code - Arfa Kareem Society',
                html: `<div style="text-align: center; padding: 20px;"><h2>Welcome to Arfa Kareem Society!</h2><h1>${generatedMembershipId}</h1></div>`
            });
            res.status(201).json({ message: "User created", emailSent: true });
        } catch (emailError) {
            console.error("Email failed:", emailError); // Log for server ops
            res.status(201).json({ message: "User created, but email failed.", emailSent: false });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error during signup" });
    }
};

// ==========================================
// LOGIN LOGIC
// ==========================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password." });

        const userRoles = Array.isArray(user.role) ? user.role : [user.role || 'Student'];
        const isPresident = userRoles.includes('President');

        if (!user.isActive && !isPresident) {
            return res.status(403).json({ message: "Please verify your email or wait for Admin activation." });
        }

        if (!user.isApproved && !isPresident) {
             return res.status(403).json({ message: "Your account is pending admin approval." });
        }

        const token = jwt.sign(
            { id: user._id, role: userRoles, department: user.department, semester: user.semester, timing: user.timing, batch: user.batch },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login successful", token,
            user: { id: user._id, fullName: user.fullName, email: user.email, role: userRoles }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
};

// ==========================================
// ACTIVATE ACCOUNT
// ==========================================
exports.activateAccount = async (req, res) => {
    try {
        const { membershipId, email } = req.body;
        
        // ENTERPRISE FIX: Query by BOTH email and membershipId to avoid 6-digit collisions
        const user = await User.findOne({ 
            email: email.trim().toLowerCase(),
            membershipId: membershipId.trim() 
        });

        if (!user) return res.status(404).json({ message: "Invalid Membership ID or Email mismatch." });
        if (user.isActive) return res.status(400).json({ message: "Account already active." });

        user.isActive = true;
        // Optionally, clear the membershipId here so it can't be reused
        user.membershipId = null; 
        await user.save();
        
        res.status(200).json({ message: "Account activated." });
    } catch (error) {
        res.status(500).json({ error: "Server error." });
    }
};

exports.checkUserStatus = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ isActive: user.isActive, isApproved: user.isApproved, fullName: user.fullName });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// ==========================================
// TRANSFER ROLE LOGIC
// ==========================================
exports.transferRole = async (req, res) => {
    try {
        const { currentUserId, targetUserEmail } = req.body;

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findOne({ email: targetUserEmail.toLowerCase() });

        if (!targetUser) return res.status(404).json({ message: "User with that email not found." });

        let currentRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
        let targetRoles = Array.isArray(targetUser.role) ? targetUser.role : [targetUser.role];

        // ENTERPRISE FIX: Removed 'Member' as it's not in your Enum. Used 'Student' instead.
        if (!targetRoles.includes('Student')) {
            return res.status(400).json({ message: "Target user already holds a leadership position." });
        }

        const roleToTransfer = currentRoles[0] || 'Student';
        targetUser.role = [roleToTransfer]; 
        currentUser.role = ['Student'];     

        await targetUser.save();
        await currentUser.save();

        res.status(200).json({ message: `Successfully transferred ${roleToTransfer} to ${targetUser.fullName}.` });
    } catch (error) {
        res.status(500).json({ error: "Server error during role transfer." });
    }
};