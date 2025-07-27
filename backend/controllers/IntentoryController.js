const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

// ✅ Helper: Check if MongoDB ObjectId is valid
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ✅ Add single or multiple inventory items
const addInventoryItem = async (req, res) => {
  try {
    let items = req.body;

    // If it's not an array, convert to array for consistency
    if (!Array.isArray(items)) {
      items = [items];
    }

    // Validate each item
    for (const item of items) {
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
        date,
      } = item;

      if (
        !itemName || !itemCode || quantity == null || pricePerUnit == null ||
        !supplierName || availablequantity == null || sellingprice == null ||
        totalreavanue == null || soldquantity == null || profitearn == null || !date
      ) {
        return res.status(400).json({ error: 'All fields are required for each item.' });
      }
    }

    // Insert all items at once
    const savedItems = await Inventory.insertMany(items);
    res.status(201).json({ message: 'Items added successfully', data: savedItems });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate itemCode found.' });
    }
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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

// ✅ Update inventory fields by itemCode
const updateInventoryByItemCode = async (req, res) => {
  const updates = req.body; // Expecting an array of updates

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Request body must be a non-empty array of updates.' });
  }

  const results = [];

  try {
    for (const update of updates) {
      const {
        itemCode,
        quantity,
        availablequantity,
        totalreavanue,
        profitearn,
        date
      } = update;

      if (!itemCode) {
        results.push({ error: 'Missing itemCode in one update object.' });
        continue;
      }

      const item = await Inventory.findOne({ itemCode });

      if (!item) {
        results.push({ itemCode, error: 'Item not found.' });
        continue;
      }

      if (quantity != null) item.quantity = quantity;
      if (availablequantity != null) item.availablequantity = availablequantity;
      if (totalreavanue != null) item.totalreavanue = totalreavanue;
      if (profitearn != null) item.profitearn = profitearn;
      if (date != null) item.date = date;

      await item.save();
      results.push({ itemCode, message: 'Item updated successfully', updatedItem: item });
    }

    res.status(200).json({ results });

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
  searchInventoryItems,
  updateInventoryByItemCode
};
