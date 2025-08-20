const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import User model
const { User } = require('./dist/models');

async function testLogin() {
  try {
    // Find all users
    const users = await User.find({}).select('email firstName lastName role isActive');
    console.log('\n📋 Existing users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });

    if (users.length === 0) {
      console.log('\n❌ No users found in database');
      
      // Create a test user
      console.log('\n🔧 Creating test user...');
      const testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'patient',
        isActive: true
      });
      
      await testUser.save();
      console.log('✅ Test user created: test@example.com / TestPassword123!');
    } else {
      // Test login with first user
      const testUser = users[0];
      console.log(`\n🧪 Testing login for: ${testUser.email}`);
      
      // Get full user with password
      const userWithPassword = await User.findById(testUser._id);
      
      if (!userWithPassword.password) {
        console.log('❌ User has no password set');
        return;
      }
      
      console.log('Password hash exists:', !!userWithPassword.password);
      console.log('Password hash length:', userWithPassword.password.length);
      console.log('Password hash starts with $2:', userWithPassword.password.startsWith('$2'));
      
      // Test with a common password
      const testPasswords = ['password', 'Password123!', 'TestPassword123!', 'admin123', 'test123'];
      
      for (const testPassword of testPasswords) {
        const isValid = await bcrypt.compare(testPassword, userWithPassword.password);
        console.log(`Testing '${testPassword}': ${isValid ? '✅ MATCH' : '❌ No match'}`);
        if (isValid) {
          console.log(`\n🎉 Found working credentials: ${testUser.email} / ${testPassword}`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testLogin();