import bcrypt from 'bcryptjs';
import { User } from '../models';
import { connectDB } from '../config/database';

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'super_admin';
  phone?: string;
  isActive: boolean;
}

const adminData: AdminData = {
  firstName: 'Dr. Gamal',
  lastName: 'Abdel Nasser',
  email: 'admin@dentalclinic.com',
  password: 'Admin123!',
  role: 'super_admin',
  phone: '+201017848825',
  isActive: true
};

export const createAdminUser = async (): Promise<void> => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminData.email);
      return;
    }

    // Create admin user (password will be hashed by pre-save middleware)
    const adminUser = new User({
      ...adminData
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      await connectDB();
      await createAdminUser();
      console.log('🎉 Admin seeder completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Admin seeder failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}