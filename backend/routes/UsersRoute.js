const express = require('express');
const router = express.Router();
const userController = require('../controllers/UsersController.js');
const { adminAuth, userAuth } = require('../middleware/auth');

// Only admin can register new users
router.post('/register',  userController.registerUser);

// Login is public
router.post('/login', userController.loginUser);

// Get all users (admin only)
router.get('/', adminAuth, userController.getAllUsers);

// Delete user (admin only)
router.delete('/:id', adminAuth, userController.deleteUser);

module.exports = router;
