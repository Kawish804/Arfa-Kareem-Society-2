const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // ENTERPRISE FIX: Ensure the user hasn't been deleted from the DB
        const userStillExists = await User.findById(decoded.id).select('-password');
        if (!userStillExists) {
            return res.status(401).json({ message: "User no longer exists. Authorization denied." });
        }

        req.user = userStillExists; 
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is invalid or expired." });
    }
};

module.exports = authMiddleware;