const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const models = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flashmob_learning';

async function createAdminAccount() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // Check if admin already exists
    const existingAdmin = await models.User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('Email: admin@gmail.com');
      console.log('You can update the password if needed.');
      
      // Update password and ensure is_admin is true
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.is_admin = true;
      await existingAdmin.save();
      
      console.log('✅ Admin password updated to: Admin@123');
    } else {
      // Create new admin account
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Get next user_id
      const lastUser = await models.User.findOne().sort({ user_id: -1 });
      const user_id = lastUser ? lastUser.user_id + 1 : 1;

      const adminUser = new models.User({
        user_id,
        email: 'admin@gmail.com',
        password: hashedPassword,
        name: 'Platform Administrator',
        is_admin: true,
        preferences: {
          subjects: [],
          max_distance: 5,
          favorite_venues: []
        }
      });

      await adminUser.save();
      
      console.log('\n✅ Admin account created successfully!');
      console.log('\n📧 Admin Credentials:');
      console.log('   Email: admin@gmail.com');
      console.log('   Password: Admin@123');
      console.log('\n⚠️  Please change the password after first login!');
    }

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

createAdminAccount();