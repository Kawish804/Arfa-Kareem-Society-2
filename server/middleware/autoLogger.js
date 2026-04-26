const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const autoLogger = (req, res, next) => {
    // 1. Ignore GET requests (we only track actions/changes)
    if (req.method === 'GET') return next();

    // 2. Wait for the request to finish
    res.on('finish', async () => {
        // 3. Only log successful actions
        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                let userName = 'System / Guest';
                let userRole = 'Unknown';

                // --- BULLETPROOF TOKEN READING ---
                try {
                    const authHeader = req.headers.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] !== 'null') {
                        const token = authHeader.split(' ')[1];
                        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                        
                        const user = await User.findById(decoded.id);
                        if (user) {
                            userName = user.fullName;
                            userRole = Array.isArray(user.role) ? user.role[0] : user.role;
                        }
                    }
                } catch (tokenError) {
                    // If the token is expired or broken, just ignore it and keep going!
                    console.log("⚠️ Logger couldn't read token, but continuing anyway...");
                }

                // --- SPECIAL CASE: CATCHING LOGINS ---
                if (req.originalUrl.includes('/login') && req.body.email) {
                    const loginUser = await User.findOne({ email: req.body.email });
                    if (loginUser) {
                        userName = loginUser.fullName;
                        userRole = Array.isArray(loginUser.role) ? loginUser.role[0] : loginUser.role;
                    }
                }

                // 4. Figure out WHAT they did
                const url = req.originalUrl;
                const method = req.method;
                
                let type = 'general';
                let action = `${method} action performed on ${url}`;

                if (url.includes('/login')) { type = 'login'; action = 'Logged into the system'; }
                else if (url.includes('/signup')) { type = 'member_added'; action = 'Registered a new account'; }
                else if (url.includes('/expenses')) { type = 'expense_added'; action = method === 'DELETE' ? 'Deleted an expense' : 'Added a new expense'; }
                else if (url.includes('/fund-collections')) { type = 'fund_collected'; action = 'Collected or logged a fund payment'; }
                else if (url.includes('/events')) { type = 'event_created'; action = method === 'POST' ? 'Created a new event' : 'Updated an event'; }
                else if (url.includes('/admin/users')) { type = 'role_change'; action = 'Updated a member profile or role'; }
                else if (url.includes('/participants/request')) { type = 'general'; action = 'Submitted an event participation request'; }
                else if (url.includes('/participants') && method === 'PUT') { type = 'request_approved'; action = 'Processed a student participation request'; }
                else if (url.includes('/announcements')) { type = 'announcement'; action = 'Posted or removed a society announcement'; }
                else if (url.includes('/settings')) { type = 'settings_changed'; action = 'Updated core society settings / fees'; }

                // 5. Save the log!
                await ActivityLog.create({
                    user: userName,
                    role: userRole,
                    type,
                    action,
                    ip: req.ip || 'Unknown'
                });

                // 🔴 TERMINAL X-RAY: See it working live!
                console.log(`📸 [AUTO-LOGGER]: Recorded -> ${userName} (${userRole}) | ${action}`);

            } catch (error) {
                console.error('🔴 AUTO-LOGGER FAILED TO SAVE:', error.message);
            }
        }
    });

    next();
};

module.exports = autoLogger;