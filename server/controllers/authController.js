const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// SIGNUP LOGIC
exports.signup = async (req, res) => {
    try {
        const { fullName, phone, email, password, department, semester, reason } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists." });
        }

        // Create new user (role defaults to 'Member', isApproved defaults to false)
        const newUser = new User({
            fullName,
            phone,
            email,
            password,
            department,
            semester,
            reason
        });

        await newUser.save();

        // We return a 201 status to let the frontend know it was successful
        res.status(201).json({
            message: "Application submitted successfully. Pending admin approval."
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during signup. Please try again." });
        console.error("🔴 SIGNUP ERROR:", error);
        res.status(500).json({ error: error.message || "Server error during signup" });
    }
};

// LOGIN LOGIC
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Invalid email or password." });
        }

        // 2. Verify role matches what they selected in the dropdown
        if (user.role !== role) {
            return res.status(403).json({ message: `Access denied. You are not registered as a ${role}.` });
        }

        // 3. Check if admin has approved the account (skip approval check for Admins if you want)
        if (!user.isApproved && user.role !== 'Admin') {
            return res.status(403).json({ message: "Your account is still pending admin approval." });
        }

        // 4. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 5. Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token lasts for 1 day
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during login." });
    }
};
// ACTIVATE ACCOUNT (Detective Mode)
exports.activateAccount = async (req, res) => {
    try {
        const { membershipId, email } = req.body;
        
        console.log("\n--- NEW ACTIVATION ATTEMPT ---");
        console.log("Frontend sent ID:", `"${membershipId}"`);
        console.log("Frontend sent Email:", `"${email}"`);

        const cleanId = membershipId.trim();
        const cleanEmail = email.trim().toLowerCase();

        // 1. Search ONLY by Membership ID first
        const user = await User.findOne({ membershipId: cleanId });
        
        if (!user) {
            console.log("🔴 ERROR: Could not find any user with that ID in the database.");
            return res.status(404).json({ message: "Invalid Membership ID." });
        }

        console.log("🟢 User found! Database email is:", `"${user.email}"`);

        // 2. Now manually compare the emails
        if (user.email.toLowerCase() !== cleanEmail) {
            console.log("🔴 ERROR: The emails do not match!");
            return res.status(404).json({ message: "Email does not match our records for this ID." });
        }

        // 3. Check if already active
        if (user.isActive) {
            return res.status(400).json({ message: "This account is already active. Please log in." });
        }

        // 4. Activate!
        user.isActive = true;
        await user.save();
        
        console.log("🟢 SUCCESS: Account fully activated!");
        res.status(200).json({ message: "Account activated successfully." });

    } catch (error) {
        console.error("ACTIVATION ERROR:", error);
        res.status(500).json({ error: "Server error during activation." });
    }
};