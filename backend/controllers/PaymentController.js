const mongoose = require('mongoose');
const Payment = require('../models/Payments');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

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
    const payment = new Payment({
      customerId: customerId || undefined,
      customerType,
      guestInfo: customerType === 'guest' ? guestInfo : undefined,
      quantity,
      itemCode,
      itemName,
      amount,
      paymentMethod,
      status: status || 'Pending',
      paymentDate: new Date()
    });

    await payment.save();
    res.status(201).json({ message: 'Payment recorded successfully.', payment });

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

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  issueBill,
  getPaymentHistory
};
