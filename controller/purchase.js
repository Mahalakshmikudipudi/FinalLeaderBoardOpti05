const Cashfree = require('cashfree-pg');
const Order = require('../models/orders');
const userController = require('./user');

const purchasepremium = async (req, res) => {
    try {
        const userId = req.user.id;
        const order_id = `CF_${Date.now()}_${userId}`; // Generate a unique order ID
        const amount = 2500; // Set premium membership price

        // Create an order in Cashfree
        const response = await Cashfree.orders.create({
            order_id: order_id,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_email: req.user.email,
                customer_phone: req.user.phone
            },
            order_meta: {
                return_url: `http://localhost:3000/payment-success?order_id=${order_id}`,
                notify_url: "http://localhost:3000/purchase/updatetransactionstatus"
            }
        });

        // Save order in the database
        await req.user.createOrder({ orderid: order_id, status: 'PENDING' });

        return res.status(201).json({
            order: response,
            payment_session_id: response.payment_session_id,
            app_id: process.env.CASHFREE_APP_ID
        });

    } catch (err) {
        console.error("Cashfree Order Error:", err);
        res.status(403).json({ message: 'Something went wrong', error: err.message });
    }
};

const updateTransactionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { payment_id, order_id } = req.body;

        // Find the order in the database
        const order = await Order.findOne({ where: { orderid: order_id } });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order and user premium status
        const promise1 = order.update({ paymentid: payment_id, status: 'SUCCESSFUL' });
        const promise2 = req.user.update({ ispremiumuser: true });

        await Promise.all([promise1, promise2]);

        return res.status(202).json({
            success: true,
            message: "Transaction Successful",
            token: userController.generateAccessToken(userId, undefined, true)
        });

    } catch (err) {
        console.error("Cashfree Payment Update Error:", err);
        res.status(403).json({ error: err.message, message: 'Something went wrong' });
    }
};

module.exports = {
    purchasepremium,
    updateTransactionStatus
};
