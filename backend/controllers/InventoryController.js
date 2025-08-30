const mongoose = require('mongoose');

const Inventory = require('../models/Inventory');

// ✅ Helper: Check if MongoDB ObjectId is valid
 const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const addInventoryItem = async (req, res) => {
  try {
    const { date, bottles, brand } = req.body;

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

    // Create and save the inventory (include brand)
    const newInventory = new Inventory({ _id: new mongoose.Types.ObjectId(), date, brand, bottles });
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
  const { date, bottles, brand } = req.body;

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
    // Fetch existing inventory to compute deltas for availablequantity
    const existingInventory = await Inventory.findById(id);
    if (!existingInventory) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    // Create a map of existing bottles by itemCode
    const existingMap = new Map();
    existingInventory.bottles.forEach((b) => existingMap.set(b.itemCode, b));

    // Normalize bottle data and adjust availablequantity based on change in quantity
    const normalizedBottles = bottles.map((bottle) => {
      const old = existingMap.get(bottle.itemCode);
      const newQuantity = Number(bottle.quantity);
      const providedAvailable = bottle.availablequantity !== undefined && bottle.availablequantity !== null;

      let newAvailable;
      if (providedAvailable) {
        // If client explicitly provided availablequantity (even 0), respect it
        newAvailable = Number(bottle.availablequantity);
      } else if (old) {
        // Adjust available by the change in total quantity
        const oldQty = Number(old.quantity || 0);
        const oldAvailable = Number(old.availablequantity ?? oldQty ?? 0);
        const delta = newQuantity - oldQty;
        newAvailable = oldAvailable + delta;
      } else {
        // No existing bottle, set available to new quantity
        newAvailable = newQuantity;
      }

      if (isNaN(newAvailable) || newAvailable < 0) newAvailable = 0;

      return {
        itemName: bottle.itemName || `${bottle.itemCode} Water Bottle`,
        itemCode: bottle.itemCode,
        quantity: newQuantity,
        pricePerUnit: Number(bottle.pricePerUnit) || 100,
        supplierName: bottle.supplierName || 'Default Supplier',
        availablequantity: newAvailable,
        sellingprice: Number(bottle.sellingprice) || 150,
        totalreavanue: Number(bottle.totalreavanue) || 0,
        soldquantity: Number(bottle.soldquantity) || 0,
        profitearn: Number(bottle.profitearn) || 0,
      };
    });

    // Update the inventory item (include brand)
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

      // Find the document that contains the bottle with this itemCode
      const doc = await Inventory.findOne({ 'bottles.itemCode': itemCode });
      if (!doc) {
        results.push({ itemCode, error: 'Item not found.' });
        continue;
      }

      // Find the bottle entry inside the document
      const bottle = doc.bottles.find(b => b.itemCode === itemCode);
      if (!bottle) {
        results.push({ itemCode, error: 'Bottle not found inside document.' });
        continue;
      }

      // Apply updates; compute availablequantity delta when quantity changes unless explicit availablequantity provided
      if (quantity != null && !isNaN(quantity)) {
        const newQty = Number(quantity);
        const oldQty = Number(bottle.quantity || 0);
        const delta = newQty - oldQty;
        bottle.quantity = newQty;

        if (availablequantity != null) {
          bottle.availablequantity = Number(availablequantity);
        } else {
          const oldAvailable = Number(bottle.availablequantity ?? oldQty ?? 0);
          bottle.availablequantity = Math.max(0, oldAvailable + delta);
        }
      } else if (availablequantity != null) {
        bottle.availablequantity = Number(availablequantity);
      }

      if (totalreavanue != null) bottle.totalreavanue = Number(totalreavanue);
      if (profitearn != null) bottle.profitearn = Number(profitearn);
      if (date != null) doc.date = date;

      await doc.save();
      results.push({ itemCode, message: 'Item updated successfully', updatedItem: bottle });
    }

    res.status(200).json({ results });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current stock information
const getStockInfo = async (req, res) => {
  try {
    // Get all inventory items
    const inventoryItems = await Inventory.find();
    
    // Transform into stock data format with aggregated quantities
    const stockMap = new Map();
    
    inventoryItems.forEach(item => {
      const { brand, bottles } = item;
      
      bottles.forEach(bottle => {
        const key = `${brand}-${bottle.itemCode}`;
        const currentQuantity = stockMap.has(key) ? stockMap.get(key).quantity : 0;
        
        stockMap.set(key, {
          brand,
          bottleSize: bottle.itemCode,
          quantity: currentQuantity + bottle.availablequantity
        });
      });
    });
    
    // Convert map to array
    const stockData = Array.from(stockMap.values());
    
    res.status(200).json(stockData);
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
  updateInventoryByItemCode,
  getStockInfo
};
