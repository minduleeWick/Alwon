const mongoose = require('mongoose');
const Payment = require('../models/Payments');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const { checkInventoryAvailability } = require('./InventoryController');

const issueBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerName,
      customerPhone,
      customerType,
      customerId,
      bottles,
      amount,
      paidAmount = 0,
      creditAmount = 0,
      remainingAmount = 0,
      paymentMethod,
      chequeNo,
      chequeDate,
      bankName,
      chequeStatus,
      creditLimit,
    } = req.body;

    // Validate required fields
    if (!customerType || !bottles || !bottles.length || !amount || !paymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'customerType, bottles, amount, and paymentMethod are required.' });
    }

    // Validate customerType
    if (!['registered', 'guest'].includes(customerType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid customerType. Must be registered or guest.' });
    }

    // Validate paymentMethod
    if (!['Cash', 'Cheque', 'Credit'].includes(paymentMethod)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid paymentMethod. Must be Cash, Cheque, or Credit.' });
    }

    // For registered customers, validate customerId
    let customer = null;
    if (customerType === 'registered') {
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Valid customerId is required for registered customers.' });
      }
      customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Customer not found.' });
      }
    }

    // For guests, validate guestInfo
    if (customerType === 'guest') {
      if (!customerName || !customerPhone) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'customerName and customerPhone are required for guest payments.' });
      }
    }

    // Validate cheque-specific fields
    if (paymentMethod === 'Cheque') {
      if (!chequeNo || !chequeDate || !bankName || !chequeStatus) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'chequeNo, chequeDate, bankName, and chequeStatus are required for Cheque payments.' });
      }
      if (!['Pending', 'Cleared', 'Bounced'].includes(chequeStatus)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Invalid chequeStatus. Must be Pending, Cleared, or Bounced.' });
      }
    }


    // Check inventory availability
    const { updatedBottles } = await checkInventoryAvailability(bottles, session);

    // Create payment documents
    const payments = [];
    for (const bottle of updatedBottles) {
      const { type, quantity, price, itemCode } = bottle;
      if (!type || quantity < 1 || price < 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Each bottle must have type, quantity, and price.' });
      }

      const payment = new Payment({
        customerId: customerType === 'registered' ? customerId : undefined,
        customerType,
        guestInfo: customerType === 'guest' ? { name: customerName, phone: customerPhone } : undefined,
        quantity,
        itemCode,
        itemName: type,
        amount: quantity * price,
        paidAmount,
        creditAmount,
        payment: paymentMethod === 'Cash' || paymentMethod === 'Cheque' ? quantity * price : paidAmount / bottles.length,
        deupayment: paymentMethod === 'Credit' ? creditAmount / bottles.length : 0,
        creaditlimit: paymentMethod === 'Credit' ? creditLimit : undefined, // Legacy field
        creditLimit: paymentMethod === 'Credit' ? creditLimit : undefined,
        paymentMethod,
        paymentDate: new Date(),
        status: paymentMethod === 'Cash' || paymentMethod === 'Cheque' || paidAmount >= amount ? 'Completed' : 'Pending',
        chequeNo: paymentMethod === 'Cheque' ? chequeNo : undefined,
        chequeDate: paymentMethod === 'Cheque' ? chequeDate : undefined,
        bankName: paymentMethod === 'Cheque' ? bankName : undefined,
        chequeStatus: paymentMethod === 'Cheque' ? chequeStatus : undefined,
      });

      payments.push(payment);
    }

    // Save all payments
    await Payment.insertMany(payments, { session });

    // Update customer balance if registered
    if (customerType === 'registered' && customer) {
      const totalUnsettled = await Payment.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: 'Pending' } },
        { $group: { _id: null, totalUnsettled: { $sum: '$deupayment' } } },
      ]).session(session);
      const newBalance = totalUnsettled.length > 0 ? totalUnsettled[0].totalUnsettled : 0;
      await Customer.findByIdAndUpdate(customerId, { balance: newBalance }, { session });
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ message: 'Bill recorded successfully.', payments });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error issuing bill:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { issueBill };

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
