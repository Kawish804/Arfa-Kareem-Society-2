const Contribution = require('../models/Contribution');
// Assuming you have the FundCollection model to update the treasury
const FundCollection = require('../models/FundCollection'); 
const { logActivity } = require('./activityController');

exports.recordContribution = async (req, res) => {
    try {
        const { studentName, email, department, rollNo, amount, purpose, transactionId } = req.body;

        // 1. Save to the dedicated Contributions database (For keeping donor details)
        const newContribution = await Contribution.create({
            studentName, email, department, rollNo, amount, purpose, transactionId
        });

        // 2. Mirror this into the Finance FundCollection (So treasury balance goes up)
        await FundCollection.create({
            studentName: `${studentName} (Online Donation)`,
            rollNo: transactionId,
            department: purpose, 
            semester: 'N/A',
            timing: 'N/A',
            amount: Number(amount),
            status: 'Paid',
            date: new Date().toISOString().split('T')[0],
            uploadedBy: 'Stripe Gateway'
        });

        // 3. Log the activity silently
        await logActivity(studentName, 'Contributor', 'fund_collected', `Contributed Rs ${amount} towards ${purpose}`);

        res.status(201).json(newContribution);
    } catch (error) {
        console.error('Contribution Saving Error:', error);
        res.status(500).json({ error: 'Failed to record contribution' });
    }
};