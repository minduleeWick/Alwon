const express = require('express');
const paymentController = require('../controllers/PaymentController.js');
const router = express.Router();


// Issue a bill (for registered or guest customer)
router.post('/issue', paymentController.issueBill);

// Get payment history (for a customer or all)
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;