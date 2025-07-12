const express = require('express');
const inventoryController = require('../controllers/IntentoryController.js'); // ✅ fixed typo
const router = express.Router();

// Create a new inventory item
router.post('/add', inventoryController.addInventoryItem);
router.get('/', inventoryController.getAllInventoryItems);

router.put('/:id', inventoryController.editInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.get('/search', inventoryController.searchInventoryItems);


module.exports = router;
