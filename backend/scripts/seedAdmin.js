// backend/scripts/seedAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      return;
    }
    
    // Create admin user
    const admin = new User({
      name: 'System Admin',
      email: 'admin@creditbureau.com',
      password: 'admin123', // Will be hashed by the pre-save hook
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdmin();