const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const fundRoutes = require('./routes/fundRoutes');
const fundCollectionRoutes = require('./routes/fundCollectionRoutes');

const app = express();

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors());         // Allows frontend to talk to backend

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to Database"))
    .catch((err) => console.log("Database connection error:", err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/fund-collections', require('./routes/fundCollectionRoutes'));
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});