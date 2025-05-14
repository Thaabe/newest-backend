// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  idNumber: {
    type: String,
    required: function() {
      return this.role !== 'admin';
    }
  },
  role: {
    type: String,
    enum: ['consumer', 'lender', 'admin'],
    default: 'consumer'
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.role !== 'lender'; // Only lenders need approval
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);