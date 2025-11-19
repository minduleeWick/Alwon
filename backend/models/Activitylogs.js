
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  activityType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    required: true,
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);