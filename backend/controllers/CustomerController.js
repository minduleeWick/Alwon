const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Payment = require('../models/Payments');

// ✅ Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ Add a new customer
const addCustomer = async (req, res) => {
  try {
    const { customername, idnumber, address, phone, email, type } = req.body;

    // Check for missing fields
    if (!customername || !idnumber || !address || !phone || !email || !type) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Create and save the customer
    const customer = new Customer({ customername, idnumber, address, phone, email, type });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    // Handle unique constraint and validation errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ error: `${field} already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a customer by ID
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid customer ID format.' });
  }

  try {
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Edit/update a customer by ID
const editCustomer = async (req, res) => {
  const { id } = req.params;
  const { customername, idnumber, address, phone, email, type } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid customer ID format.' });
  }

  if (!customername || !idnumber || !address || !phone || !email || !type) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { customername, idnumber, address, phone, email, type },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    res.json(updatedCustomer);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ error: `${field} already exists.` });
    }
    res.status(400).json({ error: err.message });
  }
};

// ✅ Search customers by name or email
const searchCustomers = async (req, res) => {
  const { query } = req.query;

  try {
    const customers = await Customer.find({
      $or: [
        { customername: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllCustomerCreditSummaries = async (req, res) => {
  try {
    // Aggregate payment data grouped by customerId
    const summaries = await Payment.aggregate([
      {
        $match: { customerId: { $ne: null } } // Only registered customers
      },
      {
        $group: {
          _id: '$customerId',
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          totalPayment: { $sum: { $ifNull: ['$paidAmount', 0] } }
        }
      },
      {
        $addFields: {
          balance: { $subtract: ['$totalAmount', '$totalPayment'] }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          customerId: '$_id',
          customername: '$customer.customername',
          email: '$customer.email',
          phone: '$customer.phone',
          totalAmount: 1,
          totalPayment: 1,
          balance: 1
        }
      }
    ]);

    res.status(200).json(summaries);
  } catch (err) {
    console.error('Error fetching all credit summaries:', err);
    res.status(500).json({ error: 'Server error while fetching all credit summaries.' });
  }
};
// ✅ Export all functions
module.exports = {
  addCustomer,
  getAllCustomers,
  deleteCustomer,
  editCustomer,
  searchCustomers,
  getAllCustomerCreditSummaries,
};
