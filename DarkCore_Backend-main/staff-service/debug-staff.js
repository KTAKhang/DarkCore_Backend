require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('./src/models/UserModel');
const RoleModel = require('./src/models/RolesModel');

async function debugStaff() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/darkcore');
        console.log('✅ Connected to MongoDB');

        // Check the specific user you mentioned
        const userId = '68c83690ec1db775d76b558d';
        const user = await UserModel.findById(userId).populate('role_id', 'name');
        console.log('👤 User found:', user);

        if (user) {
            console.log('Role ID:', user.role_id);
            console.log('Role name:', user.role_id?.name);
        }

        // Check all roles
        const allRoles = await RoleModel.find({});
        console.log('📋 All roles:', allRoles);

        // Check ALLOWED_ROLES
        const ALLOWED_ROLES = ["sales-staff", "repair-staff"];
        const staffRoles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        console.log('👔 Staff roles found:', staffRoles);

        // Check users with staff roles
        const staffRoleIds = staffRoles.map(role => role._id);
        console.log('🔍 Staff role IDs:', staffRoleIds);

        const staffUsers = await UserModel.find({ role_id: { $in: staffRoleIds } }).populate('role_id', 'name');
        console.log('👥 Staff users found:', staffUsers.length);
        staffUsers.forEach(user => {
            console.log(`  - ${user.user_name} (${user.email}) - Role: ${user.role_id?.name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

debugStaff();
