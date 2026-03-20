const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // <-- NEW IMPORT

// ==========================================
// 1. SIGNUP LOGIC (WITH REAL EMAIL)
// ==========================================
// ==========================================
// 1. SIGNUP LOGIC (With Admin Override Fallback)
// ==========================================
// server/controllers/authController.js

exports.signup = async (req, res) => {
    try {
        const { fullName, email, phone, role /* ...other fields */ } = req.body;

        // 1. Standard check
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered." });

        const membershipId = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Create the user in the DB (Inactive by default)
        const newUser = new User({ ...req.body, membershipId, isActive: false, isApproved: false });
        await newUser.save();

        // 3. ATTEMPT TO SEND EMAIL
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Arfa Kareem Society Code',
            text: `Your code is ${membershipId}`
        };

        // Use a Promise-based approach to catch the error BEFORE sending the response
        try {
            await transporter.sendMail(mailOptions);
            // EMAIL SUCCESS: Tell frontend to show "Enter Code" screen
            return res.status(201).json({
                success: true,
                emailSent: true,
                message: "Verification code sent to your email."
            });
        } catch (mailError) {
            console.error("🔴 Mail Delivery Failed:", mailError.message);
            // EMAIL FAILED: Tell frontend to show "Manual Activation" screen
            return res.status(201).json({
                success: true,
                emailSent: false,
                message: "We couldn't reach your email address. Manual activation is required."
            });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. LOGIN LOGIC
// ==========================================
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log(`Attempting login for: ${email} with role: ${role}`);

        // 1. Find User
        const user = await User.findOne({ email });
        if (!user) {
            console.log("❌ Login Failed: User not found in database.");
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Login Failed: Password does not match.");
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 3. Check Role (Crucial: Must match exactly)
        if (user.role !== role) {
            console.log(`❌ Login Failed: Role mismatch. DB has ${user.role}, but user selected ${role}`);
            return res.status(400).json({ message: "Role mismatch. Please select the correct role." });
        }

        // 4. Create Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log("✅ Login Successful for:", user.fullName);

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
        console.error("🔴 LOGIN ERROR:", error);
        res.status(500).json({ error: "Server error during login" });
    }
};

// ==========================================
// 3. ACTIVATE ACCOUNT LOGIC
// ==========================================
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
exports.manuallyActivateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Force the account to be active
        user.isActive = true;
        // Optional: You can also auto-approve them here if you want 1-click activation & approval
        // user.isApproved = true; 

        await user.save();

        res.status(200).json({ message: `${user.fullName}'s account has been manually activated!` });
    } catch (error) {
        console.error("🔴 ADMIN ACTIVATION ERROR:", error);
        res.status(500).json({ error: "Server error during manual activation." });
    }
};