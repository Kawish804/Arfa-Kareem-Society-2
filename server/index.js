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

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
                fullName: process.env.MASTER_ADMIN_NAME || "Society President", // <--- UPDATED
                email: adminEmail,
                password: process.env.MASTER_ADMIN_PASSWORD,
                phone: process.env.MASTER_ADMIN_PHONE || "0000000000", // <--- UPDATED
                department: process.env.MASTER_ADMIN_DEPT || "Management", // <--- UPDATED
                semester: process.env.MASTER_ADMIN_SEMESTER || "N/A", // <--- UPDATED
                rollNo: process.env.MASTER_ADMIN_ROLLNO || "ADMIN-01", // <--- UPDATED
                timing: process.env.MASTER_ADMIN_TIMING || "Morning", // <--- UPDATED
                role: "Admin",
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
        // We call the bootstrap here to ensure DB is ready
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
app.use('/api/students', studentRoutes);

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});