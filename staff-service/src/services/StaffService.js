
const UserModel = require("../models/UserModel");
const RoleModel = require("../models/RolesModel");

const ALLOWED_ROLES = ["sales-staff", "repair-staff"];

// Normalize various status inputs to boolean
function normalizeStatus(input) {
    if (input === true || input === "true" || input === "active") return true;
    if (input === false || input === "false" || input === "inactive") return false;
    return null;
}

const StaffService = {

    async updateStaffStatus(staffId, status) {
        try {
            const normalized = normalizeStatus(status);
            if (!staffId || normalized === null) {
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
            staff.status = normalized;
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
                status: true,
                avatar: data.avatar || ""
                // Không truyền googleId khi tạo staff
            });
            await newUser.save();
            return { status: "OK", message: "Staff account created successfully" };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },


    async getStaffs(query = {}) {
        const { page = 1, limit = 10 } = query;
        const roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        const roleIds = roles.map(role => role._id);

        const filter = { role_id: { $in: roleIds } };
        if (query.status !== undefined) {
            const normalized = normalizeStatus(query.status);
            if (normalized !== null) filter.status = normalized;
        }

        // Sorting options
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        let sortOption = { createdAt: -1 }; // default newest first
        if (sortBy === "name" || sortBy === "username" || sortBy === "user_name") {
            sortOption = { user_name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created" || sortBy === "createdat" || sortBy === "created_at") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        } else {
            sortOption = { createdAt: -1 };
        }

        const users = await UserModel.find(filter)
            .populate('role_id', 'name')
            .collation({ locale: 'en', strength: 2 })
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();
        const total = await UserModel.countDocuments(filter);

        const data = users.map(u => ({
            ...u,
            role_name: u.role_id?.name,
            role_id: u.role_id?._id || u.role_id,
        }));

        return { status: "OK", data, pagination: { page: Number(page), limit: Number(limit), total } };
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

    async searchStaffs(keyword, query = {}) {
        const { page = 1, limit = 10 } = query;
        const roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        const roleIds = roles.map(role => role._id);

        // Sorting
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        let sortOption = { createdAt: -1 };
        if (sortBy === "name" || sortBy === "username" || sortBy === "user_name") {
            sortOption = { user_name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created" || sortBy === "created_at" || sortBy === "createdat") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        }

        const criteria = {
            role_id: { $in: roleIds },
            $or: [
                { user_name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } }
            ]
        };
        if (query.status !== undefined) {
            const normalized = normalizeStatus(query.status);
            if (normalized !== null) criteria.status = normalized;
        }

        const users = await UserModel.find(criteria)
            .populate('role_id', 'name')
            .collation({ locale: 'en', strength: 2 })
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();
        const total = await UserModel.countDocuments(criteria);

        const data = users.map(u => ({
            ...u,
            role_name: u.role_id?.name,
            role_id: u.role_id?._id || u.role_id,
        }));

        return { status: "OK", data, pagination: { page: Number(page), limit: Number(limit), total } };
    },

    async filterStaffs(filters = {}) {
        const { page = 1, limit = 10 } = filters;
        let roles = await RoleModel.find({ name: { $in: ALLOWED_ROLES } });
        let roleIds = roles.map(role => role._id);
        if (filters.role && ALLOWED_ROLES.includes(filters.role)) {
            const roleDoc = await RoleModel.findOne({ name: filters.role });
            if (roleDoc) roleIds = [roleDoc._id];
        }
        const criteria = { role_id: { $in: roleIds } };
        if (filters.status !== undefined) {
            const normalized = normalizeStatus(filters.status);
            if (normalized !== null) criteria.status = normalized;
        }

        // Sorting
        const sortBy = (filters.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (filters.sortOrder ?? "desc").toString().trim().toLowerCase();
        let sortOption = { createdAt: -1 };
        if (sortBy === "name" || sortBy === "username" || sortBy === "user_name") {
            sortOption = { user_name: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "createdat" || sortBy === "created" || sortBy === "created_at" || sortBy === "createdat") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        }

        const users = await UserModel.find(criteria)
            .populate('role_id', 'name')
            .collation({ locale: 'en', strength: 2 })
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();
        const total = await UserModel.countDocuments(criteria);

        const data = users.map(u => ({
            ...u,
            role_name: u.role_id?.name,
            role_id: u.role_id?._id || u.role_id,
        }));

        return { status: "OK", data, pagination: { page: Number(page), limit: Number(limit), total } };
    }
};

module.exports = StaffService;
