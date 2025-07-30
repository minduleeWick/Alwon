const express = require('express');
const customerController = require('../controllers/CustomerController');
const router = express.Router();

// Add a new customer
router.post('/add', customerController.addCustomer);

// Get all customers
router.get('/', customerController.getAllCustomers);

// Delete a customer by ID
router.delete('/:id', customerController.deleteCustomer);

// Edit (update) a customer by ID
router.put('/:id', customerController.editCustomer);

// Search customers by name or email
router.get('/search', customerController.searchCustomers);

module.exports = router;