const mongoose = require('mongoose');
const Payment = require('../models/Payments');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const ActivityLog = require('../models/Activitylogs');

// helper: create activity log without failing the main flow
const safeLog = async (payload) => {
  try {
    const log = new ActivityLog(payload);
    await log.save();
  } catch (e) {
    console.error('Activity log failed:', e.message);
  }
};

// ✅ Issue a payment (bill)
const issueBill = async (req, res) => {
  try {
    const {
      customerId,
      customerType,
      guestInfo,
      quantity,
      itemCode,
      itemName,
      amount,
      payment,
      deupayment,
      creaditlimit,
      paymentMethod,
      status
    } = req.body;

    // Validate required fields
    if (!customerType || !itemCode || !itemName || !quantity || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    // Validate customerType
    if (!['registered', 'guest'].includes(customerType)) {
      return res.status(400).json({ error: 'Invalid customerType. Must be registered or guest.' });
    }

    // For registered customers, check if customerId exists
    if (customerType === 'registered') {
      if (!customerId) {
        return res.status(400).json({ error: 'customerId is required for registered customers.' });
      }
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
    }

    // For guests, validate guestInfo
    if (customerType === 'guest') {
      if (!guestInfo || !guestInfo.name) {
        return res.status(400).json({ error: 'Guest info (at least name) is required for guest payments.' });
      }
    }

    // Validate item exists in inventory
    const inventoryItem = await Inventory.findById(itemCode);
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    // Create payment
    const paymentDoc = new Payment({
      customerId: customerId || undefined,
      customerType,
      guestInfo: customerType === 'guest' ? guestInfo : undefined,
      quantity,
      itemCode,
      itemName,
      amount,
      payment,
      deupayment,
      creaditlimit,
      paymentMethod,
      status: status || 'Pending',
      paymentDate: new Date()
    });

    await paymentDoc.save();

    // Activity log for payment issuance
    await safeLog({
      activityType: 'PAYMENT_ISSUE',
      description: `Payment issued: ${paymentDoc._id} for item ${itemName || itemCode} amount ${amount}`,
      userId: req.user && req.user._id ? req.user._id : undefined,
      username: req.user && req.user.username ? req.user.username : (customerType === 'guest' ? (guestInfo && guestInfo.name) : ''),
      role: req.user && req.user.role ? req.user.role : 'system',
      timestamp: new Date(),
      ipAddress: req.ip || '',
      meta: {
        paymentId: paymentDoc._id,
        customerId: customerId || null,
        itemCode,
        quantity,
        amount,
        paymentMethod,
        status: paymentDoc.status
      }
    });

    res.status(201).json({ message: 'Payment recorded successfully.', payment: paymentDoc });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get payment history (all or by customer)
const getPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.query;
    let filter = {};

    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ error: 'Invalid customer ID format.' });
      }
      filter.customerId = customerId;
    }

    const payments = await Payment.find(filter)
      .populate('customerId', 'customername email') // optional: populate customer info
      .populate('itemCode', 'itemName') // optional: populate item info
      .sort({ paymentDate: -1 });

    // Activity log for viewing payment history
    await safeLog({
      activityType: 'PAYMENT_HISTORY_VIEW',
      description: `Payment history viewed${ customerId ? ` for customer ${customerId}` : ' (all)' }`,
      userId: req.user && req.user._id ? req.user._id : undefined,
      username: req.user && req.user.username ? req.user.username : '',
      role: req.user && req.user.role ? req.user.role : 'system',
      timestamp: new Date(),
      ipAddress: req.ip || '',
      meta: {
        queryCustomerId: customerId || null,
        resultsCount: Array.isArray(payments) ? payments.length : 0
      }
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  issueBill,
  getPaymentHistory
};
