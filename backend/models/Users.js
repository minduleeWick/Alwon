const mongoose = require('mongoose');
const UsersSchema = new mongoose.Schema({
    
    username: {
        type: String,
        required: true, 
    },
    userid: {
        type: String,
        required: false,
        unique: true,
    },
    password: {
        type: String,
        required: true,  
    },
    role:{
        type: String,
        enum: ['admin', 'user'],
        required: true
    }
     

});



module.exports = mongoose.model('Users', UsersSchema);