const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import User model
const { User } = require('./dist/models');

async function createFreshUser() {
  try {
    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@dentalclinic.com' });
    console.log('🗑️ Deleted existing test user');
    
    // Create a fresh user with known password
    const testPassword = 'test123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    
    console.log('🔒 Creating user with:');
    console.log('Password:', testPassword);
    console.log('Hash:', hashedPassword);
    
    // Test the hash immediately
    const testComparison = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✅ Hash verification test:', testComparison);
    
    const newUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@dentalclinic.com',
      password: hashedPassword, // Use pre-hashed password to avoid double hashing
      role: 'admin',
      isActive: true
    });
    
    // Save without triggering pre-save middleware
    await User.collection.insertOne(newUser.toObject());
    console.log('✅ Fresh test user created: test@dentalclinic.com / test123');
    
    // Verify the saved user
    const savedUser = await User.findOne({ email: 'test@dentalclinic.com' }).select('+password');
    if (savedUser) {
      console.log('📋 Saved user details:');
      console.log('Email:', savedUser.email);
      console.log('Password hash:', savedUser.password);
      
      // Test password comparison
      const isValid = await bcrypt.compare(testPassword, savedUser.password);
      console.log('🔍 Password comparison result:', isValid);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

createFreshUser();