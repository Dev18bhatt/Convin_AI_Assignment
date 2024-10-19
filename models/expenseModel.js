const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to User model
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be a positive number'], // Optional: ensures amount is positive
    },
    participants: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'User', // Reference to User model
            },
            type: {
                type: String,
                enum: ['equal', 'exact', 'percentage'], // Valid types
                required: true,
            },
            amountOwed: {
                type: Number,
                min: 0 // Should be non-negative, only for 'exact' type
            },
            percentage: {
                type: Number,
                required: function () { return this.type === 'percentage'; }, // Required only if type is 'percentage'
                min: 0,
                max: 100 // Ensure percentage is between 0 and 100
            }
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Expense', expenseSchema);
