// backend/models/CreditRecord.js

const mongoose = require('mongoose');

const CreditRecordSchema = new mongoose.Schema({
  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loanType: {
    type: String,
    required: true,
    enum: ['Personal', 'Home', 'Auto', 'Education', 'Credit Card', 'Business', 'Other']
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Late', 'Defaulted', 'Outstanding'],
    default: 'Outstanding'
  },
  paymentHistory: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['Paid', 'Late', 'Defaulted', 'Outstanding']
      },
      amount: {
        type: Number
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CreditRecord', CreditRecordSchema);