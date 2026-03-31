const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// ==========================================
// LIVE EMAIL CONFIGURATION
// ==========================================
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
// 1. SIGNUP LOGIC
// ==========================================
exports.signup = async (req, res) => {
    try {
        // 1. Extract everything, including the batch
        const { fullName, email, phone, password, role, department, semester, rollNo, timing, batch, reason } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        // 2. Hash password correctly using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Generate a random 6-digit Membership ID for email verification
        const generatedMembershipId = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Create the new user
        const newUser = new User({
            fullName,
            email,
            phone,
            password: hashedPassword, // Uses the properly hashed password!
            role,
            department,
            semester,
            rollNo,
            timing,
            batch, // Saves the year/batch for CR matching
            reason,
            membershipId: generatedMembershipId,
            isActive: false,
            isApproved: false
        });

        await newUser.save();

        // 5. Send Live Email
        try {
            const mailOptions = {
                from: `"Arfa Kareem Society" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Your Verification Code - Arfa Kareem Society',
                html: `
                    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
                        <h2 style="color: #1e293b;">Welcome to Arfa Kareem Society!</h2>
                        <p style="color: #475569; font-size: 16px;">Please use the verification code below to complete your registration:</p>
                        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; display: inline-block; border: 2px dashed #3b82f6; margin: 15px 0;">
                            <h1 style="color: #3b82f6; letter-spacing: 5px; margin: 0; font-size: 32px;">${generatedMembershipId}</h1>
                        </div>
                        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">If you did not request this, please ignore this email.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`🟢 LIVE EMAIL SENT TO ${email}`);

            res.status(201).json({ message: "User created", emailSent: true });

        } catch (emailError) {
            console.error("🔴 FAILED TO SEND LIVE EMAIL:", emailError);
            // If the email fails, the user is still saved, so we trigger manual verification phase
            res.status(201).json({ message: "User created, but email failed to send.", emailSent: false });
        }

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error during signup" });
    }
    try {
        const mailOptions = { /* ... your email config ... */ };
        await transporter.sendMail(mailOptions);
        console.log(`🟢 LIVE EMAIL SENT TO ${email}`);

        res.status(201).json({ message: "User created", emailSent: true });

    } catch (emailError) {
        console.error("🔴 FAILED TO SEND LIVE EMAIL:", emailError);

        // 🚨 THE FIX: If email fails, trigger WhatsApp!
        const waMessage = `Hello ${fullName}! This is the Arfa Kareem Society Admin. We noticed your email (${email}) bounced when you tried to sign up. No worries, your account is created! Your official Membership ID is: *${generatedMembershipId}*. Please go back to the website to activate your account.`;

        // Send the message in the background
        sendWhatsAppMessage(phone, waMessage);

        // Tell the frontend that the email failed, but SMS was sent
        res.status(201).json({
            message: "Email invalid. Sent code via WhatsApp.",
            emailSent: false
        });
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
        if (role && user.role !== role) {
            console.log(`❌ Login Failed: Role mismatch. DB has ${user.role}, but user selected ${role}`);
            return res.status(400).json({ message: "Role mismatch. Please select the correct role." });
        }

        // 4. Check if Active (Email Verified)
        if (!user.isActive && user.role !== 'Admin' && user.role !== 'President') {
            return res.status(403).json({ message: "Please verify your email or wait for Admin activation." });
        }

        // 5. Create Token 
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                department: user.department,
                semester: user.semester,
                timing: user.timing,
                batch: user.batch
            },
            process.env.JWT_SECRET || 'your_super_secret_key_change_me_later',
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
// 3. ACTIVATE ACCOUNT LOGIC (Frontend Verification)
// ==========================================
exports.activateAccount = async (req, res) => {
    try {
        const { membershipId, email } = req.body;

        console.log("\n--- NEW ACTIVATION ATTEMPT ---");
        const cleanId = membershipId.trim();
        const cleanEmail = email.trim().toLowerCase();

        // 1. Search ONLY by Membership ID first
        const user = await User.findOne({ membershipId: cleanId });

        if (!user) {
            console.log("🔴 ERROR: Could not find any user with that ID in the database.");
            return res.status(404).json({ message: "Invalid Membership ID." });
        }

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

// ==========================================
// 4. ADMIN MANUAL ACTIVATION LOGIC
// ==========================================
exports.manuallyActivateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Force the account to be active
        user.isActive = true;

        await user.save();

        res.status(200).json({ message: `${user.fullName}'s account has been manually activated!` });
    } catch (error) {
        console.error("🔴 ADMIN ACTIVATION ERROR:", error);
        res.status(500).json({ error: "Server error during manual activation." });
    }
};

// ==========================================
// 5. CHECK USER STATUS (Polling)
// ==========================================
exports.checkUserStatus = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User no longer exists (Rejected/Deleted)" });
        }

        res.status(200).json({
            isActive: user.isActive,
            isApproved: user.isApproved,
            fullName: user.fullName
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};