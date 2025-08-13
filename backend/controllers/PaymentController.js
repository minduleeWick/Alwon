const mongoose = require('mongoose');
const Payment = require('../models/Payments');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const { checkInventoryAvailability } = require('./InventoryController');
const { addCustomer } = require('./CustomerController'); // Adjust path

const CurrentStock = mongoose.model('CurrentStock'); // Ensure it's defined or required from inventory


function generateUniqueInvoiceId() {
  const timestamp = Date.now().toString().slice(-5); // last 5 digits of time
  const randomNum = Math.floor(Math.random() * 100);
  return `INV${timestamp}${String(randomNum).padStart(2, '0')}`;
}

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
      customerName = customer.customername;
      customerPhone = customer.phone;
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
      // We don't need to set customerName and customerPhone here as they're already in guestInfo
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

// Update payment record and handle returns
const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, returnedBottles, payment, deupayment } = req.body;

    // Validate payment ID
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ error: 'Invalid payment ID format.' });
    }

    // Find the payment record
    const payment_record = await Payment.findById(paymentId);
    if (!payment_record) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    // Update payment and deupayment if provided
    if (payment !== undefined) {
      payment_record.payment = payment;
    }
    
    if (deupayment !== undefined) {
      payment_record.deupayment = deupayment;
    }

    // Update status if provided
    if (status) {
      payment_record.status = status;
    }

    // Process bottle returns if provided
    if (returnedBottles && Array.isArray(returnedBottles) && returnedBottles.length > 0) {
      // For each returned bottle, update the payment record and inventory
      for (const returnItem of returnedBottles) {
        const { type, quantity } = returnItem;
        if (!type || quantity <= 0) continue;

        // Find the matching bottle in the payment record
        const bottleIndex = payment_record.bottles.findIndex(b => b.type === type);
        if (bottleIndex === -1) continue;
        
        // Ensure we don't return more than was purchased
        const originalQty = payment_record.bottles[bottleIndex].quantity;
        const validReturnQty = Math.min(quantity, originalQty);
        
        if (validReturnQty <= 0) continue;

        // Update the quantity in the payment record
        payment_record.bottles[bottleIndex].quantity -= validReturnQty;
        
        // Find inventory document containing this bottle type
        const inventoryDoc = await Inventory.findOne({ 'bottles.itemCode': type });
        if (!inventoryDoc) {
          continue; // Skip if inventory not found
        }

        // Update inventory - increase available quantity, decrease sold quantity
        await Inventory.updateOne(
          { _id: inventoryDoc._id },
          {
            $inc: {
              'bottles.$[elem].availablequantity': validReturnQty,
              'bottles.$[elem].soldquantity': -validReturnQty
            }
          },
          {
            arrayFilters: [{ 'elem.itemCode': type }]
          }
        );
      }

      // Recalculate the total amount based on updated bottle quantities
      const newTotal = payment_record.bottles.reduce((sum, bottle) => {
        return sum + (bottle.quantity * (bottle.price || 0));
      }, 0);
      
      payment_record.amount = newTotal;
      
      // Update remaining amount if applicable (for credit payments)
      if (payment_record.paymentMethod.toLowerCase() === 'credit') {
        payment_record.deupayment = Math.max(0, newTotal - (payment_record.payment || 0));
        
        // Update status based on new payment balance
        if (payment_record.deupayment <= 0) {
          payment_record.status = 'paid';
        } else if (payment_record.payment === 0) {
          payment_record.status = 'unpaid';
        } else {
          payment_record.status = 'partially paid';
        }
      }
    }

    // Save the updated payment record
    await payment_record.save();

    res.status(200).json({ 
      message: 'Payment updated successfully.', 
      payment: payment_record 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  issueBill,
  getPaymentHistory,
  updatePayment
};
