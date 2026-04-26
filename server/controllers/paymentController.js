const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const StudentFund = require('../models/StudentFund');

exports.createCheckoutSession = async (req, res) => {
    try {
        const { amount, purpose, studentName, department, rollNo } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'pkr',
                        product_data: {
                            name: `Society Contribution: ${purpose}`,
                            description: `Contribution by ${studentName}`,
                        },
                        unit_amount: amount * 100, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: { studentName, purpose, department, rollNo, amount }, 
            
            // 🔴 THE FIX: Ensure these match your exact frontend route! 
            // If your page is just /contribute, remove /dashboard
            success_url: `${process.env.FRONTEND_URL}/contribute?status=success&amount=${amount}&purpose=${encodeURIComponent(purpose)}`,
            cancel_url: `${process.env.FRONTEND_URL}/contribute?status=cancelled`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: "Failed to create payment session" });
    }
};