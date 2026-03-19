const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const fundRoutes = require('./routes/fundRoutes');
const fundCollectionRoutes = require('./routes/fundCollectionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const eventRoutes = require('./routes/eventRoutes');
const participantRoutes =  require('./routes/participantRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// --- MIDDLEWARE (ORDER MATTERS) ---
app.use(cors()); // Allows frontend to talk to backend

// High limit JSON parser for image uploads
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to Database"))
    .catch((err) => console.log("Database connection error:", err));

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

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});