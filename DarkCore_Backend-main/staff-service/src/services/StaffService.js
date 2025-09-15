
const UserModel = require("../models/UserModel");
const RoleModel = require("../models/RolesModel");

const ALLOWED_ROLES = ["sales-staff", "repair-staff"];
const ALLOWED_STATUS = ["active", "inactive"];

const StaffService = {

    async updateStaffStatus(staffId, status) {
        try {
            if (!staffId || !status || !ALLOWED_STATUS.includes(status)) {
                return { status: "ERR", message: "Staff ID and valid status are required" };
            }
            const staff = await UserModel.findById(staffId);
            if (!staff) {
                return { status: "ERR", message: "Staff not found" };
            }
            // Chỉ cho phép đổi status nếu là sales-staff hoặc repair-staff
            const roleDoc = await RoleModel.findById(staff.role_id);
            if (!roleDoc || !ALLOWED_ROLES.includes(roleDoc.name)) {
                return { status: "ERR", message: "Not a staff account" };
            }
            staff.status = status;
            await staff.save();
            return { status: "OK", message: "Staff status updated successfully" };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },


    async createStaff(data) {
        try {
            const { user_name, email, password, phone, address, role } = data;
            if (!user_name || !email || !password || !phone || !address) {
                return { status: "ERR", message: "Missing required fields" };
            }
            if (!ALLOWED_ROLES.includes(role)) {
                return { status: "ERR", message: "Role must be sales-staff or repair-staff" };
            }
            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return { status: "ERR", message: "Email already registered!" };
            }
            const existingUserName = await UserModel.findOne({ user_name });
            if (existingUserName) {
                return { status: "ERR", message: "Username already taken!" };
            }
            const staffRole = await RoleModel.findOne({ name: role });
            if (!staffRole) {
                return { status: "ERR", message: "Role not found" };
            }
            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new UserModel({
                user_name,
                email,
                password: hashedPassword,
                phone,
                address,
                role_id: staffRole._id,
                status: "active",
                avatar: data.avatar || ""
                // Không truyền googleId khi tạo staff
            });
            await newUser.save();
            return { status: "OK", message: "Staff account created successfully" };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },


    async getStaffs() {
        const roleIds = await RoleModel.find({ name: { $in: ALLOWED_ROLES } }).distinct('_id');
        return UserModel.find({ role_id: { $in: roleIds } });
    },

    async getStaffDetails(id) {
        const roleIds = await RoleModel.find({ name: { $in: ALLOWED_ROLES } }).distinct('_id');
        return UserModel.findOne({ _id: id, role_id: { $in: roleIds } });
    },

    async searchStaffs(keyword) {
        const roleIds = await RoleModel.find({ name: { $in: ALLOWED_ROLES } }).distinct('_id');
        return UserModel.find({
            role_id: { $in: roleIds },
            $or: [
                { user_name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } }
            ]
        });
    },

    async filterStaffs(filters) {
        const roleIds = await RoleModel.find({ name: { $in: ALLOWED_ROLES } }).distinct('_id');
        const query = { role_id: { $in: roleIds } };
        if (filters.status && ALLOWED_STATUS.includes(filters.status)) {
            query.status = filters.status;
        }
        return UserModel.find(query);
    }
};

module.exports = StaffService;
