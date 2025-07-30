const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true, 
  },
  password: {
    type: String,
    required: true,  
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    required: true
  },

  // ✅ Fields for Forgot Password
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model('Users', UsersSchema);
