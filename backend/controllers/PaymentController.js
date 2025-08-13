const mongoose = require('mongoose');
const Payment = require('../models/Payments');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const { checkInventoryAvailability } = require('./InventoryController');
const { addCustomer } = require('./CustomerController'); // Adjust path

const CurrentStock = mongoose.model('CurrentStock'); // Ensure it's defined or required from inventory

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
      brand,
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
    if (!customerType || !bottles || !bottles.length || !amount || !paymentMethod || !brand) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'customerType, bottles, amount, paymentMethod, and brand are required.' });
    }

    // Validate customerType
    if (!['registered', 'guest'].includes(customerType)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid customerType. Must be registered or guest.' });
    }

    // For registered customers, validate customerId
    let customer = null;
    if (customerType === 'registered') {
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Valid customerId is required for registered customers.' });
      }
      customer = await Customer.findById(customerId, null, { session });
      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Customer not found.' });
      }
    }

    // For guests, validate guestInfo and register customer
    let newCustomerId = null;
    // For guests, validate guestInfo and register customer
    if (customerType === 'guest') {
      if (!customerName || !customerPhone) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'customerName and customerPhone are required for guest payments.' });
      }
      // Register guest customer
      const customerData = {
        body: {
          customername: customerName,
          phone: customerPhone,
          type: 'Guest',
        },
      };
      try {
        const newCustomer = await addCustomer(customerData, null, session);
        newCustomerId = newCustomer._id;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(err.status || 500).json({ error: err.message });
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

    // Create payment documents
    const payments = [];
    for (const bottle of bottles) {
      const { type, quantity, price } = bottle; // Removed itemCode, as it's fetched from CurrentStock
      if (!type || quantity < 1 || price < 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Each bottle must have type, quantity, and price.' });
      }

      // Fetch itemCode from CurrentStock
      const stockItem = await CurrentStock.findOne({ brand, itemCode: type }, null, { session });
      if (!stockItem) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: `Item '${type}' not found in inventory for brand '${brand}'.` });
      }

      const payment = new Payment({
        customerId: customerType === 'registered' ? customerId : newCustomerId,
        customerType,
        guestInfo: customerType === 'guest' ? { name: customerName, phone: customerPhone } : undefined,
        quantity,
        itemCode: stockItem.itemCode, // Use itemCode from CurrentStock
        itemName: type,
        brand,
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

    // Update customer balance if registered or guest
    if (customerType === 'registered' || customerType === 'guest') {
      const effectiveCustomerId = customerType === 'registered' ? customerId : newCustomerId;
      const totalUnsettled = await Payment.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(effectiveCustomerId), status: 'Pending' } },
        { $group: { _id: null, totalUnsettled: { $sum: '$deupayment' } } },
      ], { session }); // Fixed session syntax
      const newBalance = totalUnsettled.length > 0 ? totalUnsettled[0].totalUnsettled : 0;
      await Customer.findByIdAndUpdate(effectiveCustomerId, { balance: newBalance }, { session });
    }

    // Update stock for the relevant brand after successful bill
    for (const bottle of bottles) {
      const { type, quantity } = bottle;
      const currentStock = await CurrentStock.findOne({ brand, itemCode: type }, null, { session });
      if (currentStock) {
        currentStock.availablequantity -= quantity;
        currentStock.soldquantity += quantity;
        currentStock.totalreavanue += quantity * currentStock.sellingprice;
        currentStock.profitearn += quantity * (currentStock.sellingprice - currentStock.pricePerUnit);
        await currentStock.save({ session });
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: `No stock entry found for brand '${brand}' and itemName '${type}'` });
      }
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
