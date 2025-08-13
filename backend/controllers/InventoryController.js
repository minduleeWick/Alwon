const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

// Define CurrentStock model (if not in a separate file)
const currentStockSchema = new mongoose.Schema({
  brand: { type: String, required: true, trim: true },
  itemCode: { type: String, required: true, trim: true },
  itemName: { type: String, default: '' },
  availablequantity: { type: Number, default: 0, min: 0 },
  sellingprice: { type: Number, default: 150 },
  pricePerUnit: { type: Number, default: 100 },
  supplierName: { type: String, default: 'Default Supplier' },
  totalreavanue: { type: Number, default: 0 },
  soldquantity: { type: Number, default: 0 },
  profitearn: { type: Number, default: 0 },
});

// Ensure unique index on brand and itemCode
currentStockSchema.index({ brand: 1, itemCode: 1 }, { unique: true });

const CurrentStock = mongoose.model('CurrentStock', currentStockSchema);

// ✅ Helper: Check if MongoDB ObjectId is valid
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const addInventoryItem = async (req, res) => {
  try {
    const { date, brand, bottles } = req.body;

    // Validate date, brand, and bottles array
    if (!date || !brand || !Array.isArray(bottles) || bottles.length === 0) {
      return res.status(400).json({ error: 'Date, brand, and bottles are required.' });
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
    const newInventory = new Inventory({ _id: new mongoose.Types.ObjectId(), date, brand, bottles });
    const saved = await newInventory.save();

    // Update CurrentStock
    for (const bottle of bottles) {
      const { itemCode, quantity, itemName, pricePerUnit, supplierName, sellingprice, totalreavanue, soldquantity, profitearn } = bottle;
      await CurrentStock.findOneAndUpdate(
        { brand, itemCode },
        {
          $set: {
            itemName: itemName || '',
            pricePerUnit: pricePerUnit || 100,
            supplierName: supplierName || 'Default Supplier',
            sellingprice: sellingprice || 150,
          },
          $inc: { availablequantity: quantity },
        },
        { upsert: true, new: true }
      );
    }

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
  const { date, brand, bottles } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid item ID format.' });
  }

  // Validate date, brand, and bottles array
  if (!date || !brand || !Array.isArray(bottles) || bottles.length === 0) {
    return res.status(400).json({ error: 'Date, brand, and bottles array are required.' });
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
      { date, brand, bottles: normalizedBottles },
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
        { 'bottles.itemName': { $regex: query, $options: 'i' } },
        { 'bottles.itemCode': { $regex: query, $options: 'i' } },
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

      const inventory = await Inventory.findOne({ 'bottles.itemCode': itemCode });
      if (!inventory) {
        results.push({ itemCode, error: 'Item not found.' });
        continue;
      }

      const bottle = inventory.bottles.find((b) => b.itemCode === itemCode);
      if (!bottle) {
        results.push({ itemCode, error: 'Bottle not found in inventory.' });
        continue;
      }

      if (quantity != null) bottle.quantity = quantity;
      if (availablequantity != null) bottle.availablequantity = availablequantity;
      if (totalreavanue != null) bottle.totalreavanue = totalreavanue;
      if (profitearn != null) bottle.profitearn = profitearn;
      if (date != null) inventory.date = date;

      await inventory.save();
      results.push({ itemCode, message: 'Item updated successfully', updatedItem: inventory });
    }

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCurrentStock = async (session, brand = null) => {
  try {
    const match = {};
    if (brand) match.brand = brand;
    const stock = await CurrentStock.find(match).session(session);
    return stock;
  } catch (err) {
    throw new Error(`Failed to get current stock: ${err.message}`);
  }
};

// Check and update inventory availability
const checkInventoryAvailability = async (bottles, brand, session) => {
  try {
    const currentStock = await getCurrentStock(session, brand);

    const updatedBottles = [];
    for (const bottle of bottles) {
      const { type, quantity } = bottle;
      if (!type || quantity < 1) {
        throw new Error(`Invalid bottle data: type=${type}, quantity=${quantity}`);
      }

      const stockItem = currentStock.find((s) => s.itemName === type && s.brand === brand);
      if (!stockItem) {
        throw new Error(`Item '${type}' not found in inventory for brand '${brand}'.`);
      }
      if (stockItem.availablequantity < quantity) {
        throw new Error(`Insufficient quantity for '${type}' (brand: ${brand}). Available: ${stockItem.availablequantity}, Requested: ${quantity}`);
      }

      updatedBottles.push({ ...bottle, itemCode: stockItem.itemCode });
    }

    // Deduct quantities from CurrentStock
    for (const bottle of updatedBottles) {
      const { itemCode, quantity } = bottle;
      await CurrentStock.findOneAndUpdate(
        { brand, itemCode },
        { $inc: { availablequantity: -quantity, soldquantity: quantity } },
        { session }
      );
    }

    return { success: true, updatedBottles };
  } catch (err) {
    throw new Error(`Inventory check failed: ${err.message}`);
  }
};

// ✅ Export all functions
module.exports = {
  addInventoryItem,
  getAllInventoryItems,
  editInventoryItem,
  deleteInventoryItem,
  searchInventoryItems,
  updateInventoryByItemCode,
  checkInventoryAvailability,
  isValidObjectId,
  getCurrentStock
};