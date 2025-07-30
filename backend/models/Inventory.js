const mongoose = require('mongoose');

const bottleSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  itemName: { type: String, default: '' },
  pricePerUnit: { type: Number, default: 100 },
  supplierName: { type: String, default: 'Default Supplier' },
  availablequantity: { type: Number, default: 0 },
  sellingprice: { type: Number, default: 150 },
  totalreavanue: { type: Number, default: 0 },
  soldquantity: { type: Number, default: 0 },
  profitearn: { type: Number, default: 0 },
});

const inventorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  bottles: [bottleSchema],
});

// Ensure unique index on itemCode within bottles array
inventorySchema.index({ 'bottles.itemCode': 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);