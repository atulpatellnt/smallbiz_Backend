const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// MongoDB Atlas URI (replace with your own connection string)
const MONGO_URI = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {

}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// Schemas
const customerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    userType: { type: String, default: "customer" }
});

const businessOwnerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    businessName: String,
    businessAddress: String,
    businessType: String,
    userType: { type: String, default: "business" }
});

const orderSchema = new mongoose.Schema({
    items: [
        {
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    timestamp: { type: Date, default: Date.now }
});

// In-memory storage for orders
let orders = [];

// Models
const Customer = mongoose.model('Customer', customerSchema);
const BusinessOwner = mongoose.model('BusinessOwner', businessOwnerSchema);
const Order = mongoose.model('Order', orderSchema);
// Routes
app.post('/signup', async (req, res) => {
    try {
        const { userType } = req.body;

        if (userType === 'customer') {
            const user = new Customer(req.body);
            await user.save();
        } else if (userType === 'business') {
            const user = new BusinessOwner(req.body);
            await user.save();
        } else {
            return res.status(400).json({ message: "Invalid user type." });
        }

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Signup failed." });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        let user;

        if (userType === 'customer') {
            user = await Customer.findOne({ email, password });
        } else if (userType === 'business') {
            user = await BusinessOwner.findOne({ email, password });
        } else {
            return res.status(400).json({ message: "Invalid user type." });
        }

        if (user) {
            res.json({ message: "Login successful!", user });
        } else {
            res.status(401).json({ message: "Invalid email or password." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Login failed." });
    }
});

app.post('/checkout', async (req, res) => {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty or invalid.' });
    }

    try {
        const newOrder = new Order({ items: cartItems });
        await newOrder.save();

        console.log('✅ New order stored in DB:', newOrder);
        res.status(200).json({ message: 'Order placed successfully.', order: newOrder });
    } catch (err) {
        console.error('❌ Failed to save order:', err);
        res.status(500).json({ message: 'Failed to place order.' });
    }
});


app.get('/orders', async (req, res) => {
    try {
        const allOrders = await Order.find();
        res.json(allOrders);
    } catch (err) {
        console.error('❌ Failed to fetch orders:', err);
        res.status(500).json({ message: 'Failed to fetch orders.' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
