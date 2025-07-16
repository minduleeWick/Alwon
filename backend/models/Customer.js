const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customername: {
    type: String,
    required: true,
    
  },
  // idnumber: {
  //   type: String,
  //   required: true,
  //   unique: true,
   
  // },
  //   address: {  
  //   type: String,
  //   required: true,
  // },

  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/ // Assuming phone number is 10 digits long
  },

  //  email: {
  //   type: String,
  //   required: true,
  //   unique: true,
  //   match: /.+\@.+\..+/ // Basic email validation

  // },
  // type: {
  //   type: String,
  //   enum: ['Individual', 'Business'],
  //   required: true
  // },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Customer', customerSchema);
