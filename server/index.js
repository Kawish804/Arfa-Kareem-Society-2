const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- IMPORT USER MODEL (Required for Bootstrap) ---
const User = require('./models/User');

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const fundRoutes = require('./routes/fundRoutes');
const fundCollectionRoutes = require('./routes/fundCollectionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const eventRoutes = require('./routes/eventRoutes');
const participantRoutes = require('./routes/participantRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const settingRoutes = require('./routes/settingsRoutes');
const studentRoutes = require('./routes/studentRoutes');
const studentFundRoutes = require('./routes/studentfundRoutes'); // 🔴 NEW: Imported Student Fund Routes
const societyRoutes = require('./routes/societyRoutes');
const activityRoutes = require('./routes/activityRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contributionRoutes = require('./routes/contributionRoutes');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔴 AUTO-LOGGER MUST GO HERE! 
// (After express.json so it can read data, but BEFORE your routes)
const autoLogger = require('./middleware/autoLogger');
app.use(autoLogger);

// --- BOOTSTRAP FUNCTION ---
const bootstrapAdmin = async () => {
    try {
        console.log("🔍 Checking for Master Admin...");
        const adminEmail = process.env.MASTER_ADMIN_EMAIL;

        if (!adminEmail) {
            console.error("❌ ERROR: MASTER_ADMIN_EMAIL is missing in .env");
            return;
        }

        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log("🚀 Creating Master Admin with Custom Details...");
            const masterAdmin = new User({
                fullName: process.env.MASTER_ADMIN_NAME || "Society President",
                email: adminEmail,
                password: process.env.MASTER_ADMIN_PASSWORD,
                phone: process.env.MASTER_ADMIN_PHONE || "0000000000",
                department: process.env.MASTER_ADMIN_DEPT || "Management",
                semester: process.env.MASTER_ADMIN_SEMESTER || "N/A",
                rollNo: process.env.MASTER_ADMIN_ROLLNO || "ADMIN-01",
                timing: process.env.MASTER_ADMIN_TIMING || "Morning",
                role: "President",
                isActive: true,
                isApproved: true,
                membershipId: "ADMIN-001"
            });
            await masterAdmin.save();
            console.log(`🟢 SUCCESS: Admin ${process.env.MASTER_ADMIN_NAME} created.`);
        } else {
            console.log("ℹ️ Admin already exists in DB.");
        }
    } catch (error) {
        console.error("🔴 BOOTSTRAP ERROR:", error.message);
    }
};

// --- DATABASE CONNECTION & STARTUP ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ Connected to Database");
        await bootstrapAdmin();
    })
    .catch((err) => console.log("❌ Database connection error:", err));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/fund-collections', fundCollectionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contributions', contributionRoutes);
// 🔴 MOUNTED BOTH STUDENT ROUTES TO THE SAME BASE PATH
app.use('/api/students', studentRoutes); 
app.use('/api/students', studentFundRoutes); 

app.use('/api', societyRoutes);
app.use('/api/activities', activityRoutes);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});