const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const otpGenerator = require('otp-generator');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
// Serve local static assets (e.g., product images)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Health check
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// API routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);

// Optional: OTP demo endpoints (in-memory)
let otpStore = {};
app.post('/api/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  otpStore[phone] = otp;
  console.log(`OTP for ${phone}: ${otp}`);
  res.json({ message: 'OTP sent successfully!' });
});
app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (otpStore[phone] && otpStore[phone] === otp) {
    delete otpStore[phone];
    return res.json({ success: true, message: 'OTP verified successfully!', role: 'user' });
  }
  res.json({ success: false, message: 'Invalid OTP' });
});

// Global error handler fallback
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// MongoDB connection and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitfuel';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
