const express = require('express');
const inventoryController = require('../controllers/InventoryController.js');
const router = express.Router();

// Routes
router.post('/add', inventoryController.addInventoryItem);
router.get('/', inventoryController.getAllInventoryItems);
router.put('/:id', inventoryController.editInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.get('/search', inventoryController.searchInventoryItems);
router.put('/update-by-code', inventoryController.updateInventoryByItemCode); // ✅ correct for bulk


module.exports = router;