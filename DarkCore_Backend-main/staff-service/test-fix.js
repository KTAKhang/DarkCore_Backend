require('dotenv').config();
const mongoose = require('mongoose');
const StaffService = require('./src/services/StaffService');

async function testFix() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/darkcore');
        console.log('✅ Connected to MongoDB');

        // Test getStaffs function
        console.log('🧪 Testing getStaffs...');
        const staffs = await StaffService.getStaffs();
        console.log('📋 Staff count:', staffs.length);
        console.log('👥 Staffs:', staffs);

        if (staffs.length > 0) {
            console.log('✅ SUCCESS: Staff service is working!');
        } else {
            console.log('❌ FAILED: No staff found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testFix();
