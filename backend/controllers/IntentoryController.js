const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

// ✅ Helper: Check if MongoDB ObjectId is valid
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ Add a new inventory item
const addInventoryItem = async (req, res) => {
  try {
    const {
      itemName,
      itemCode,
      quantity,
      pricePerUnit,
      supplierName,
      availablequantity,
      sellingprice,
      totalreavanue,
      soldquantity,
      profitearn,
    } = req.body;

    // Required field check
    if (
      !itemName || !itemCode || quantity == null || pricePerUnit == null ||
      !supplierName || availablequantity == null || sellingprice == null ||
      totalreavanue == null || soldquantity == null || profitearn == null
    ) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const item = new Inventory({
      itemName,
      itemCode,
      quantity,
      pricePerUnit,
      supplierName,
      availablequantity,
      sellingprice,
      totalreavanue,
      soldquantity,
      profitearn,
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Item code already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all inventory items
const getAllInventoryItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete an inventory item by ID
const deleteInventoryItem = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid item ID format.' });
  }

  try {
    const item = await Inventory.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Edit/update an inventory item by ID
const editInventoryItem = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid item ID format.' });
  }

  const {
    itemName,
    itemCode,
    quantity,
    pricePerUnit,
    supplierName,
    availablequantity,
    sellingprice,
    totalreavanue,
    soldquantity,
    profitearn,
  } = req.body;

  if (
    !itemName || !itemCode || quantity == null || pricePerUnit == null ||
    !supplierName || availablequantity == null || sellingprice == null ||
    totalreavanue == null || soldquantity == null || profitearn == null
  ) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      {
        itemName,
        itemCode,
        quantity,
        pricePerUnit,
        supplierName,
        availablequantity,
        sellingprice,
        totalreavanue,
        soldquantity,
        profitearn,
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.json(updatedItem);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Item code already exists.' });
    }
    res.status(400).json({ error: err.message });
  }
};

// ✅ Search inventory items by name or code
const searchInventoryItems = async (req, res) => {
  const { query } = req.query;

  try {
    const items = await Inventory.find({
      $or: [
        { itemName: { $regex: query, $options: 'i' } },
        { itemCode: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Export all functions
module.exports = {
  addInventoryItem,
  getAllInventoryItems,
  editInventoryItem,
  deleteInventoryItem,
  searchInventoryItems
};
