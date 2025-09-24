
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
        const roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        const roleIds = roles.map(role => role._id);
        const users = await UserModel.find({ role_id: { $in: roleIds } })
            .populate('role_id', 'name')
            .lean();
        return users.map(u => ({
            ...u,
            role_name: u.role_id?.name,
            role_id: u.role_id?._id || u.role_id,
        }));
    },

    async getStaffDetails(id) {
        const roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        const roleIds = roles.map(role => role._id);
        const user = await UserModel.findOne({ _id: id, role_id: { $in: roleIds } })
            .populate('role_id', 'name')
            .lean();
        if (!user) return null;
        return {
            ...user,
            role_name: user.role_id?.name,
            role_id: user.role_id?._id || user.role_id,
        };
    },

    async searchStaffs(keyword) {
        const roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        const roleIds = roles.map(role => role._id);
        const users = await UserModel.find({
            role_id: { $in: roleIds },
            $or: [
                { user_name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } }
            ]
        }).populate('role_id', 'name').lean();
        return users.map(u => ({
            ...u,
            role_name: u.role_id?.name,
            role_id: u.role_id?._id || u.role_id,
        }));
    },

    async filterStaffs(filters) {
        let roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        let roleIds = roles.map(role => role._id);
        if (filters.role && ALLOWED_ROLES.includes(filters.role)) {
            const roleDoc = await RoleModel.findOne({ name: filters.role });
            if (roleDoc) roleIds = [roleDoc._id];
        }
        const query = { role_id: { $in: roleIds } };
        if (filters.status && ALLOWED_STATUS.includes(filters.status)) {
            query.status = filters.status;
        }
        const users = await UserModel.find(query).populate('role_id', 'name').lean();
        return users.map(u => ({
            ...u,
            role_name: u.role_id?.name,
            role_id: u.role_id?._id || u.role_id,
        }));
    }
};

module.exports = StaffService;
