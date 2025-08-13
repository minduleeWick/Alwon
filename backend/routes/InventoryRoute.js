const express = require('express');
const inventoryController = require('../controllers/InventoryController.js');
const router = express.Router();

// Routes
router.post('/add', inventoryController.addInventoryItem);
router.get('/', inventoryController.getAllInventoryItems);
router.put('/:id', inventoryController.editInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.get('/search', inventoryController.searchInventoryItems);
router.get('/stock', async (req, res) => {
  try {
    const stock = await inventoryController.getCurrentStock(null); // Pass null for session if not in transaction
    res.status(200).json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/update-by-code', inventoryController.updateInventoryByItemCode); // ✅ correct for bulk


module.exports = router;