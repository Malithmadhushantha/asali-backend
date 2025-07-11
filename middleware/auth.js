const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Verify admin role
const verifyAdmin = (req, res, next) => {
  console.log('Checking admin role for user:', req.user?.email, 'Role:', req.user?.role);
  
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  
  if (req.user.role !== 'admin') {
    console.log(`Access denied for user ${req.user.email}. Role: ${req.user.role}`);
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  
  console.log(`Admin access granted for ${req.user.email}`);
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin
};