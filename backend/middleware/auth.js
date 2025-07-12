const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');

const app = express();
app.use(cors());

// Middleware to verify JWT token and check for admin role
const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied, admin only' });
    }

    req.user = decoded; // Attach decoded user info to the request
    console.log('Admin Authenticated:', decoded); // Debugging: Log decoded token
    next();
  } catch (error) {
    console.error('Admin Auth Error:', error.message); // Debugging: Log error
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to verify JWT token
const userAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach decoded user info to the request
    console.log('User Authenticated:', decoded); // Debugging: Log decoded token
    next();
  } catch (error) {
    console.error('User Auth Error:', error.message); // Debugging: Log error
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = {
  adminAuth,
  userAuth,
};