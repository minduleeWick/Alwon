const express = require('express');
const router = express.Router();
const userController = require('../controllers/UsersController.js');
const { adminAuth, userAuth } = require('../middleware/auth');

// ---------- Auth ----------
router.post('/login', userController.loginUser);

// 🔐 Forgot / Reset password
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);

// (Optional) change password while logged in
// router.post('/change-password', userAuth, userController.changePassword);

// ---------- Users ----------
/** Admin only */
router.post('/register', userController.registerUser);
router.get('/', adminAuth, userController.getAllUsers);
router.delete('/:id', adminAuth, userController.deleteUser);
router.put('/:id', adminAuth, userController.editUser); // ✅ Edit user added

// (Optional) get currently logged-in user profile
// router.get('/me', userAuth, userController.getMe);

module.exports = router;
