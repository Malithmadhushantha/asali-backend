const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// CORS Configuration for Production
const corsOptions = {
  origin: [
    'http://localhost:3000',        // Local development
    'http://127.0.0.1:3000',        // Alternative local
    'https://asali-frontend.vercel.app',  // Production frontend
    'https://asali-frontend-*.vercel.app'  // Preview deployments
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
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
  res.json({ 
    message: 'Asali House of Fashion API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
    ],
    cors_origins: corsOptions.origin
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: https://asali-backend.onrender.com/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});