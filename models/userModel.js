const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/expensemanagementdb")
    .then(() => {
        console.log('Database connection has been done successfully...');
    })
    .catch((err) => {
        console.log(err);
    })

// Define the user schema with validation
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters long'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensure email is unique
        trim: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'], // Email regex validation
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true, // Ensure mobile number is unique
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'], // Ensure exactly 10 digits
    },
    password: {
        type: String,
        required: [true, 'Password feild is required'],
    }
}, { timestamps: true });

// Create the user model and export it
module.exports = mongoose.model('User', userSchema);
