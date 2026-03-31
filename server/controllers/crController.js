const ClassStudent = require('../models/ClassStudent');

// 1. CR views ONLY their class
exports.getMyClass = async (req, res) => {
    try {
        // req.user comes from your authentication middleware
        const { department, semester, timing } = req.user; 

        const myClass = await ClassStudent.find({ department, semester, timing });
        res.status(200).json(myClass);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch class list." });
    }
};

// 2. CR updates a student's fund status
exports.updateFundStatus = async (req, res) => {
    try {
        const { studentId, status } = req.body;
        
        const updatedStudent = await ClassStudent.findByIdAndUpdate(
            studentId, 
            { fundStatus: status },
            { new: true }
        );

        res.status(200).json({ message: "Status updated", student: updatedStudent });
    } catch (error) {
        res.status(500).json({ error: "Failed to update status." });
    }
};