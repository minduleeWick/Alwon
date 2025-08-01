const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: false },
  customerType: { type: String, enum: ['registered', 'guest'], required: true },
  guestInfo: {
    type: { name: String, phone: String },
    default: null,
  },
  quantity: { type: Number, required: true, min: 1 },
  itemCode: { type: String, required: true, trim: true },
  itemName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, required: true, min: 0 },
  creditAmount: { type: Number, required: true, min: 0 },
  payment: { type: Number, required: false, min: 0 },
  deupayment: { type: Number, required: false, min: 0 },
  creaditlimit: { type: Number, required: false, min: 0 }, // Legacy field, consider renaming
  paymentMethod: { type: String, enum: ['Cash', 'Cheque', 'Credit'], required: true },
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  chequeNo: { type: String, required: false },
  chequeDate: { type: String, required: false },
  bankName: { type: String, required: function() { return this.paymentMethod === 'Cheque'; } },
  chequeStatus: { type: String, enum: ['Pending', 'Cleared', 'Bounced'], required: function() { return this.paymentMethod === 'Cheque'; }, default: 'Pending' },
  creditLimit: { type: Number, required: function() { return this.paymentMethod === 'Credit'; }, min: 0 },

});

module.exports = mongoose.model('Payment', paymentSchema);
