const mongoose = require('mongoose');

const priceRateSchema = new mongoose.Schema({
  bottleType: { type: String, required: true },
  price: { type: Number, required: true }
});

const customerSchema = new mongoose.Schema({
  customername: { type: String, required: true, unique: true },
  idnumber: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  priceRates: [priceRateSchema] // <-- Add this line
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
