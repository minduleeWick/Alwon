const mongoose = require('mongoose');

const priceRateSchema = new mongoose.Schema({
  bottleType: { type: String, required: true },
  price: { type: Number, required: true }
});

const customerSchema = new mongoose.Schema({
  customername: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  type: { type: String, required: true },
  priceRates: [priceRateSchema]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
