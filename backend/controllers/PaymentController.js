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
      brand, // Added brand field
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
    if (!customerType || !itemCode || !itemName || !quantity || !amount || !paymentMethod || !brand) {
      return res.status(400).json({ error: 'All required fields must be provided including brand.' });
    }

    // Validate customerType
    if (!['registered', 'guest'].includes(customerType)) {
      return res.status(400).json({ error: 'Invalid customerType. Must be registered or guest.' });
    }

    let customerName;
    let customerPhone;

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
      // We don't need to set customerName and customerPhone here as they're already in guestInfo
    }

    // Validate bottles array
    if (!Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ error: 'At least one bottle entry is required.' });
    }

    // Check if each bottle has a brand
    for (const bottle of bottles) {
      if (!bottle.brand) {
        bottle.brand = brand; // Use the main brand if bottle-specific brand is not provided
      }
    }

    // For each bottle type in the request, we need to check total available quantity across all inventory entries
    for (const bottle of bottles) {
      // Find all inventory documents containing this bottle type AND brand
      const inventoryDocs = await Inventory.find({ 
        brand: bottle.brand,
        'bottles.itemCode': bottle.type 
      });
      
      if (!inventoryDocs || inventoryDocs.length === 0) {
        return res.status(400).json({ 
          error: `No inventory found for bottle type: ${bottle.type} of brand: ${bottle.brand}` 
        });
      }

      // Calculate total available quantity across all inventory entries for this brand
      let totalAvailable = 0;
      const bottleInventories = [];
      
      // Gather all inventory entries for this bottle type and brand
      for (const doc of inventoryDocs) {
        const invBottles = doc.bottles.filter(b => b.itemCode === bottle.type);
        for (const invBottle of invBottles) {
          totalAvailable += invBottle.availablequantity;
          bottleInventories.push({
            inventoryId: doc._id,
            bottle: invBottle,
            available: invBottle.availablequantity
          });
        }
      }

      // Check if total stock is sufficient
      if (totalAvailable < bottle.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${bottle.brand} bottle type: ${bottle.type}. Available: ${totalAvailable}, Requested: ${bottle.quantity}`
        });
      }

      // Update inventory - we need to distribute the requested quantity across available inventory entries
      let remainingToDeduct = bottle.quantity;
      
      // Sort bottle inventories by any criteria you prefer (FIFO, LIFO, etc.)
      bottleInventories.sort((a, b) => a.bottle.createdAt - b.bottle.createdAt);
      
      for (const inv of bottleInventories) {
        if (remainingToDeduct <= 0) break;
        
        const deductAmount = Math.min(inv.available, remainingToDeduct);
        remainingToDeduct -= deductAmount;
        
        // Update this inventory entry
        const updateResult = await Inventory.updateOne(
          { _id: inv.inventoryId },
          {
            $inc: {
              'bottles.$[elem].availablequantity': -deductAmount,
              'bottles.$[elem].soldquantity': deductAmount
            }
          },
          {
            arrayFilters: [{ 'elem.itemCode': bottle.type, 'elem.availablequantity': { $gte: deductAmount } }]
          }
        );
        
        if (updateResult.modifiedCount === 0) {
          return res.status(400).json({ 
            error: `Failed to update inventory for ${bottle.brand} bottle type: ${bottle.type}` 
          });
        }
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
      brand, // Add brand to payment record
      amount,
      payment,
      deupayment,
      creaditlimit,
      paymentMethod,
      status: computedStatus,
      paymentDate: new Date(),
      bottles, // Now bottles include brand information
      invoiceNo: generateUniqueInvoiceId(),
      // Only set customerName and customerPhone for registered customers
      customerName: customerType === 'registered' ? customerName : undefined,
      customerPhone: customerType === 'registered' ? customerPhone : undefined,
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
