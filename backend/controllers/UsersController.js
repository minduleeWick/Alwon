const User = require('../models/Users');
const ActivityLog = require('../models/Activitylogs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// helper: create activity log without failing the main flow
const safeLog = async (payload) => {
  try {
    const log = new ActivityLog(payload);
    await log.save();
  } catch (e) {
    console.error('Activity log failed:', e.message);
  }
};

// ✅ Register a new user (Admin only)
const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role
    });

    await user.save();

    // log activity (actor might be admin in req.user or system)
    await safeLog({
      activityType: 'USER_REGISTER',
      description: `User registered: ${user.username}`,
      userId: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date(),
      ipAddress: req.ip || ''
    });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Login user
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // log successful login
    await safeLog({
      activityType: 'USER_LOGIN',
      description: `User login: ${user.username}`,
      userId: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date(),
      ipAddress: req.ip || ''
    });

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a user by ObjectId
const deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // log deletion (actor is req.user)
    await safeLog({
      activityType: 'USER_DELETE',
      description: `User deleted: ${user.username} (${user._id}) by admin ${req.user.username || req.user.id}`,
      userId: user._id,
      username: user.username,
      role: user.role,
      actorId: req.user.id || req.user._id,
      actorUsername: req.user.username || '',
      timestamp: new Date(),
      ipAddress: req.ip || ''
    });

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Edit user by ID (admin only)
const editUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { id } = req.params;
    const { username, password, role } = req.body;

    const updateData = { username, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // log edit
    await safeLog({
      activityType: 'USER_EDIT',
      description: `User updated: ${updatedUser.username} (${updatedUser._id}) by admin ${req.user.username || req.user.id}`,
      userId: updatedUser._id,
      username: updatedUser.username,
      role: updatedUser.role,
      actorId: req.user.id || req.user._id,
      actorUsername: req.user.username || '',
      timestamp: new Date(),
      ipAddress: req.ip || ''
    });

    res.json({ message: 'User updated successfully.', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Forgot Password
const forgotPassword = async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email || 'it21272868@my.sliit.lk',
      subject: 'Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });

    // log forgot password request
    await safeLog({
      activityType: 'PASSWORD_RESET_REQUEST',
      description: `Password reset requested for ${user.username}`,
      userId: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date(),
      ipAddress: req.ip || ''
    });

    res.json({ message: 'Password reset email sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reset Password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // log reset
    await safeLog({
      activityType: 'PASSWORD_RESET',
      description: `Password reset for ${user.username}`,
      userId: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date(),
      ipAddress: req.ip || ''
    });

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  editUser,
  forgotPassword,
  resetPassword
};
