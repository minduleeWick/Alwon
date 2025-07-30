const mongoose = require('mongoose');

const Inventory = require('../models/Inventory');

// ✅ Helper: Check if MongoDB ObjectId is valid
 const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const addInventoryItem = async (req, res) => {
  try {
    const { date, bottles } = req.body;

    // Validate date and bottles array
    if (!date || !Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ error: 'Date and bottles are required.' });
    }

    // Validate each bottle and check for duplicates
    const itemCodes = new Set();
    for (const bottle of bottles) {
      const { itemCode, quantity } = bottle;

      // Check for missing, null, or empty itemCode
      if (!itemCode || itemCode.trim() === '' || itemCode === null) {
        return res.status(400).json({ error: 'All bottles must have a valid itemCode.' });
      }

      // Check for duplicate itemCodes within the request
      if (itemCodes.has(itemCode)) {
        return res.status(400).json({ error: `Duplicate itemCode found: ${itemCode}` });
      }
      itemCodes.add(itemCode);

      // Validate quantity
      if (quantity == null || isNaN(quantity)) {
        return res.status(400).json({ error: 'Quantity is required and must be a number.' });
      }
    }

    // Create and save the inventory
    const newInventory = new Inventory({ _id: new mongoose.Types.ObjectId(), date, bottles });
    const saved = await newInventory.save();

    return res.status(201).json({ message: 'Inventory added successfully', data: saved });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

const editInventoryItem = async (req, res) => {
  const { id } = req.params;
  const { date, bottles } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid item ID format.' });
  }

  // Validate date and bottles array
  if (!date || !Array.isArray(bottles) || bottles.length === 0) {
    return res.status(400).json({ error: 'Date and bottles array are required.' });
  }

  // Validate each bottle
  for (const bottle of bottles) {
    const { itemCode, quantity } = bottle;

    if (!itemCode || itemCode.trim() === '' || itemCode === null) {
      console.log('Invalid itemCode:', itemCode);
      return res.status(400).json({ error: 'itemCode and quantity are required for all bottles.' });
    }

    if (quantity == null || isNaN(quantity) || quantity < 0) {
      console.log('Invalid quantity:', quantity);
      return res.status(400).json({ error: 'itemCode and quantity are required for all bottles.' });
    }
  }

  try {
    // Normalize bottle data
    const normalizedBottles = bottles.map((bottle) => ({
      itemName: bottle.itemName || `${bottle.itemCode} Water Bottle`,
      itemCode: bottle.itemCode,
      quantity: Number(bottle.quantity),
      pricePerUnit: Number(bottle.pricePerUnit) || 100,
      supplierName: bottle.supplierName || 'Default Supplier',
      availablequantity: Number(bottle.availablequantity) || Number(bottle.quantity) || 0,
      sellingprice: Number(bottle.sellingprice) || 150,
      totalreavanue: Number(bottle.totalreavanue) || 0,
      soldquantity: Number(bottle.soldquantity) || 0,
      profitearn: Number(bottle.profitearn) || 0,
    }));

    // Update the inventory item
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { date, bottles: normalizedBottles },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    res.json({ message: 'Inventory item updated successfully.', item: updatedItem });
  } catch (err) {
    console.error('Edit error:', err);
    res.status(500).json({ error: 'Server error while updating inventory item.' });
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
