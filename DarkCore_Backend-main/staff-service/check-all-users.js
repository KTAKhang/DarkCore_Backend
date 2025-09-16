require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./src/models/UserModel');
const RoleModel = require('./src/models/RolesModel');

async function checkAllUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/darkcore');
        console.log('✅ Connected to MongoDB');

        // Check all users
        const allUsers = await UserModel.find({}).populate('role_id', 'name');
        console.log('👥 All users in database:', allUsers.length);
        
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.user_name} (${user.email})`);
            console.log(`   - ID: ${user._id}`);
            console.log(`   - Role ID: ${user.role_id?._id}`);
            console.log(`   - Role Name: ${user.role_id?.name}`);
            console.log(`   - Status: ${user.status}`);
            console.log('---');
        });

        // Check if any user has sales-staff role
        const salesRole = await RoleModel.findOne({ name: 'sales-staff' });
        if (salesRole) {
            const salesUsers = await UserModel.find({ role_id: salesRole._id });
            console.log(`\n👔 Users with sales-staff role: ${salesUsers.length}`);
            salesUsers.forEach(user => {
                console.log(`  - ${user.user_name} (${user.email})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkAllUsers();
