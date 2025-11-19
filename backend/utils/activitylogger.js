const ActivityLog = require('../models/Activitylogs');
const mongoose = require('mongoose');

/**
 * Log activity according to Activitylogs model.
 * Only logs when a valid req.user is present (model requires userId & role).
 * @param {Object} req - Express request (expects req.user._id and req.user.role)
 * @param {string} activityType - short type (required by model)
 * @param {string} description - detailed description (required by model)
 * @returns {Promise<void>}
 */
const logActivity = async (req, activityType, description) => {
  try {
    if (!req || !req.user || !req.user._id) return; // model requires userId

    if (!activityType || !description) return;

    const userId = req.user._id instanceof mongoose.Types.ObjectId
      ? req.user._id
      : mongoose.Types.ObjectId(req.user._id);

    const role = req.user.role || 'user';

    const log = new ActivityLog({
      activityType,
      description,
      userId,
      role,
      timestamp: new Date()
    });

    await log.save();
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;