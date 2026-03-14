require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Sending it to yourself!
    subject: "Test Email",
    text: "If you get this, Nodemailer is working perfectly!"
}, (error, info) => {
    if (error) {
        console.error("🔴 ERROR DETAILS:", error.message);
    } else {
        console.log("🟢 SUCCESS! Email sent:", info.response);
    }
});