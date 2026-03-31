const Student = require('../models/Student');

// 1. PRESIDENT: Smart Upload (Upsert) WITH DEBUGGING
exports.uploadStudents = async (req, res) => {
    try {
        console.log("\n--- 🚀 NEW CSV UPLOAD ATTEMPT ---");

        // 1. Check if the body even arrived
        if (!req.body || !req.body.students) {
            console.log("🔴 ERROR: req.body.students is undefined. The frontend didn't send the data correctly.");
            return res.status(400).json({ error: "No student data received by the server." });
        }

        const { students } = req.body;

        if (students.length === 0) {
            console.log("🔴 ERROR: Students array is empty!");
            return res.status(400).json({ error: "The CSV file was empty or failed to parse." });
        }

        console.log(`🟢 Received ${students.length} students. Example of the first student:`);
        console.log(students[0]); // Prints the exact object to see if Mongoose hates a specific field

        // 2. Prepare Bulk Operations
        const bulkOps = students.map(student => ({
            updateOne: {
                filter: { rollNumber: student.rollNumber },
                update: { $set: student },
                upsert: true
            }
        }));

        // 3. Execute Database Write
        const result = await Student.bulkWrite(bulkOps);

        console.log(`✅ SUCCESS: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`);
        res.status(201).json({ message: "Students uploaded successfully!" });

    } catch (error) {
        console.error("\n🔴 MONGODB UPLOAD CRASHED!");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);

        // This catches specific row-by-row errors in bulk uploads!
        if (error.writeErrors) {
            console.error("Bulk Write Errors:", JSON.stringify(error.writeErrors, null, 2));
        }

        res.status(500).json({
            error: "Database rejected the upload.",
            details: error.message
        });
    }
};

// 2. PRESIDENT: Gets EVERY student
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ department: 1, semester: 1 });
        res.status(200).json(students);
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ error: "Failed to fetch students." });
    }
};

// 3. CR: Gets ONLY their specific class
exports.getCRClassList = async (req, res) => {
    try {
        const { department, semester, timing, batch } = req.user;

        const myClass = await Student.find({
            department: department,
            semester: semester,
            shift: timing,
            batch: batch
        });

        res.status(200).json(myClass);
    } catch (error) {
        console.error("Error fetching CR class:", error);
        res.status(500).json({ error: "Failed to fetch your class." });
    }
};

// 4. BOTH: Update a student's fund status
exports.updateFundStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const studentId = req.params.id;

        const updatedStudent = await Student.findByIdAndUpdate(
            studentId,
            { fundStatus: status },
            { new: true }
        );

        res.status(200).json(updatedStudent);
    } catch (error) {
        res.status(500).json({ error: "Failed to update fund status." });
    }
};