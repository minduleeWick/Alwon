const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
    },
    itemCode: {
        type: String,
        required: true,
        unique: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0, // Quantity cannot be negative
    },
    pricePerUnit: {
        type: Number,
        required: false,
        min: 0, // Price cannot be negative
    },
    supplierName: {
        type: String,
        required: false,
    },
    availablequantity: {
        type: Number,
        required: true,
        min: 0, // Available quantity cannot be negative
    },
    sellingprice: {
        type: Number,
        required: false,
        min: 0, // Selling price cannot be negative
    },
    totalreavanue: {
        type: Number,
        required: false,
        min: 0, // Total revenue cannot be negative
    },
    soldquantity: {
        type: Number,
        required: false, // Sold quantity cannot be negative
        min: 0,
    },
    profitearn: {
        type: Number,
        required: false,
        min: 0, // Profit earned cannot be negative
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    });

module.exports = mongoose.model('Inventory', inventorySchema);