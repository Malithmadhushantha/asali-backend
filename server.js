const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
// Replace 'YOUR_MONGODB_URI' with your actual MongoDB connection string
mongoose.connect(process.env.MONGODB_URI || 'YOUR_MONGODB_URI', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Asali House of Fashion API is running!' });
});

// Debug route to list all auth routes
app.get('/api/debug/routes', (req, res) => {
  res.json({
    message: 'Available auth routes',
    routes: [
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'POST /api/auth/google-login',
      'GET /api/auth/me',
      'PUT /api/auth/profile',
      'GET /api/auth/test-admin',
      'GET /api/auth/users',
      'PATCH /api/auth/users/:userId/role'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  console.log(`Debug routes at: http://localhost:${PORT}/api/debug/routes`);
});