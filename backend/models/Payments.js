const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },

    customerType: {
        type: String,
        enum: ['registered', 'guest'],
        required: true
    },
    guestInfo: {
        type: {
            name: { type: String, trim: true },
            phone: { type: String, match: /^[0-9]{10}$/ } // Assuming phone number is 10 digits long
        },
        default: null // Guest info is optional
    },
    quantity: {
        type: Number,
        required: true,
        min: 1 // Quantity must be at least 1
    },
    itemCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0 // Amount cannot be negative
    },
    payment:{
        type: Number,
        required: false,
        min: 0 // Payment cannot be negative
    },
    deupayment: {
        type: Number,
        required: false,
        min: 0 // Due payment cannot be negative
    },
    creaditlimit: {
        type: Number,
        required: false,
        min: 0 // Credit limit cannot be negative
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'Online'],
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
