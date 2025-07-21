const express = require('express');
const inventoryController = require('../controllers/IntentoryController.js');
const router = express.Router();

// Routes
router.post('/add', inventoryController.addInventoryItem);
router.get('/', inventoryController.getAllInventoryItems);
router.put('/:id', inventoryController.editInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.get('/search', inventoryController.searchInventoryItems);
router.put('/update-by-code/:itemCode', inventoryController.updateInventoryByItemCode); // ✅ FIXED

module.exports = router;