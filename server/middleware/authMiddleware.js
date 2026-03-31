const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Get the token from the frontend's request header
    const token = req.header('Authorization')?.split(' ')[1]; // Expects "Bearer <token>"

    // 2. If no token, deny access BEFORE it hits the controller
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        // 3. Decode the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_change_me_later');
        
        // 4. Attach the decoded user data (department, semester, etc.) to req.user
        req.user = decoded; 
        
        // 5. Move to the next function (the controller)
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = authMiddleware;