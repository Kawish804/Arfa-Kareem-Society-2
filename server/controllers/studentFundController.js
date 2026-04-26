const User = require('../models/User');
const StudentFund = require('../models/StudentFund'); // Your new model!

// Fetch the CR's class and their fund status
exports.getMyClass = async (req, res) => {
    try {
        // Find the CR making the request (Assumes your auth middleware sets req.user)
        const cr = await User.findById(req.user.id); 
        if (!cr) return res.status(404).json({ error: "CR not found" });

        // Find all students in the exact same class as the CR
        const students = await User.find({
            role: 'Student', // Or whatever role normal class members have
            department: cr.department,
            semester: cr.semester,
            timing: cr.timing
        });

        // Map students to their fund records, creating them if they don't exist yet
        const classWithFunds = await Promise.all(students.map(async (student) => {
            let fundRecord = await StudentFund.findOne({ userId: student._id });
            
            if (!fundRecord) {
                fundRecord = await StudentFund.create({
                    userId: student._id,
                    fullName: student.fullName,
                    rollNumber: student.rollNo,
                    department: student.department,
                    shift: student.timing,
                    semester: student.semester,
                    fundStatus: 'Pending',
                    arrears: 0
                });
            }
            return fundRecord;
        }));

        res.status(200).json(classWithFunds);
    } catch (error) {
        console.error("🔴 GET CLASS ERROR:", error);
        res.status(500).json({ error: "Failed to fetch class" });
    }
};

// Update a specific student's fund status and arrears
exports.updateStudentFund = async (req, res) => {
    try {
        const { status, arrears } = req.body;
        
        const updated = await StudentFund.findByIdAndUpdate(
            req.params.id, 
            { fundStatus: status, arrears: Number(arrears) },
            { new: true }
        );
        
        res.status(200).json(updated);
    } catch (error) {
        console.error("🔴 UPDATE FUND ERROR:", error);
        res.status(500).json({ error: "Failed to update fund status" });
    }
};