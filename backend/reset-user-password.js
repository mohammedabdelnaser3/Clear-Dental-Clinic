const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import User model
const { User } = require('./dist/models');

async function resetUserPassword() {
  try {
    // Find a user to reset password for
    const user = await User.findOne({ email: 'admin@dentalclinic.com' });
    
    if (!user) {
      console.log('❌ User not found, creating a test user...');
      
      // Create a test user
      const testUser = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@dentalclinic.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      
      await testUser.save();
      console.log('✅ Test user created: admin@dentalclinic.com / admin123');
    } else {
      console.log(`Found user: ${user.email}`);
      
      // Reset password to a known value
      const newPassword = 'admin123';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      user.password = hashedPassword;
      await user.save();
      
      console.log(`✅ Password reset for ${user.email}`);
      console.log(`New password: ${newPassword}`);
      
      // Verify the password works
      const isValid = await bcrypt.compare(newPassword, hashedPassword);
      console.log(`Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

resetUserPassword();