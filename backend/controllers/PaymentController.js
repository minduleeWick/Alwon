const mongoose = require('mongoose');
const Payment = require('../models/Payments');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');


function generateUniqueInvoiceId() {
  const timestamp = Date.now().toString().slice(-5); // last 5 digits of time
  const randomNum = Math.floor(Math.random() * 100);
  return `INV${timestamp}${String(randomNum).padStart(2, '0')}`;
}

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
      status,
      bottles,
      chequeNo,
      chequeDate,
      remainingAmount
    } = req.body;

    // Validate required fields
    if (!customerType || !itemCode || !itemName || !quantity || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    // Validate customerType
    if (!['registered', 'guest'].includes(customerType)) {
      return res.status(400).json({ error: 'Invalid customerType. Must be registered or guest.' });
    }

    let customerName = '';
    let customerPhone = '';

    // For registered customers, check if customerId exists
    if (customerType === 'registered') {
      if (!customerId) {
        return res.status(400).json({ error: 'customerId is required for registered customers.' });
      }
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      customerName = customer.customername;
      customerPhone = customer.phone;
    }

    // For guests, validate guestInfo
    if (customerType === 'guest') {
      if (!guestInfo || !guestInfo.name) {
        return res.status(400).json({ error: 'Guest info (at least name) is required for guest payments.' });
      }
      customerName = guestInfo.name;
      customerPhone = guestInfo.phone || '';
    }

    // Validate bottles array
    if (!Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ error: 'At least one bottle entry is required.' });
    }

    // For each bottle, find the Inventory document that contains it, then check stock and update
    for (const bottle of bottles) {
      // Find inventory document containing this bottle type
      const inventoryDoc = await Inventory.findOne({ 'bottles.itemCode': bottle.type });
      if (!inventoryDoc) {
        return res.status(400).json({ error: `No inventory found for bottle type: ${bottle.type}` });
      }

      // Find bottle inside the bottles array
      const invBottle = inventoryDoc.bottles.find(b => b.itemCode === bottle.type);
      if (!invBottle) {
        return res.status(400).json({ error: `No inventory entry for bottle type: ${bottle.type}` });
      }

      // Check stock availability
      if (invBottle.availablequantity < bottle.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for bottle type: ${bottle.type}. Available: ${invBottle.availablequantity}, Requested: ${bottle.quantity}`
        });
      }

      // Atomically update the bottle quantities using arrayFilters and inventory document _id
      const updateResult = await Inventory.updateOne(
        { _id: inventoryDoc._id },
        {
          $inc: {
            'bottles.$[elem].availablequantity': -bottle.quantity,
            'bottles.$[elem].soldquantity': bottle.quantity
          }
        },
        {
          arrayFilters: [{ 'elem.itemCode': bottle.type, 'elem.availablequantity': { $gte: bottle.quantity } }]
        }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ error: `Failed to update inventory for bottle type: ${bottle.type}` });
      }
    }

    // Determine status based on payment method and amounts (all lowercase)
    let computedStatus = 'pending';
    const pm = paymentMethod ? paymentMethod.toLowerCase() : '';
    if (pm === 'cash') {
      computedStatus = 'paid';
    } else if (pm === 'credit') {
      const paid = Number(payment) || 0;
      const due = Number(deupayment) || 0;
      if (due <= 0) {
        computedStatus = 'paid';
      } else if (paid === 0) {
        computedStatus = 'unpaid';
      } else {
        computedStatus = 'partially paid';
      }
    } else if (pm === 'cheque') {
      computedStatus = 'pending';
    }

    // After inventory update for all bottles, save payment
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
      status: computedStatus,
      paymentDate: new Date(),
      bottles,
      invoiceNo: generateUniqueInvoiceId(),
      customerType , // Only save customerName for registered
      ...(paymentMethod === 'Cheque' && {
        chequeNo,
        chequeDate,
        remainingAmount
      })
    });

    await paymentDoc.save();

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

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  issueBill,
  getPaymentHistory
};
