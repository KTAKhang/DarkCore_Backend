const UserModel = require("../models/UserModel");
const RoleModel = require("../models/RolesModel");

const UserService = {
    // 1. Update Account status
    async updateUserStatus(userId, status) {
        try {
            if (!userId || !status) {
                return { status: "ERR", message: "User ID and status are required" };
            }
            const user = await UserModel.findById(userId);
            if (!user) {
                return { status: "ERR", message: "User not found" };
            }
            user.status = status;
            await user.save();
            return { status: "OK", message: "User status updated successfully" };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },

    // 2. Create a staff account
    async createStaff(data) {
        try {
            const { user_name, email, password, phone, address, role } = data;
            if (!user_name || !email || !password || !phone || !address) {
                return { status: "ERR", message: "Missing required fields" };
            }
            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return { status: "ERR", message: "Email already registered!" };
            }
            const existingUserName = await UserModel.findOne({ user_name });
            if (existingUserName) {
                return { status: "ERR", message: "Username already taken!" };
            }
            const staffRole = await RoleModel.findOne({ name: role || "staff" });
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
                avatar: data.avatar || "",
            });
            await newUser.save();
            return { status: "OK", message: "Staff account created successfully" };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },

    // 3. Read user accounts (list)
    async getUsers() {
        try {
            const users = await UserModel.find().populate("role_id", "name");
            return { status: "OK", data: users };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },

    // 4. Read details user account
    async getUserDetails(id) {
        try {
            const user = await UserModel.findById(id).populate("role_id", "name");
            if (!user) {
                return { status: "ERR", message: "User not found" };
            }
            return { status: "OK", data: user };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },

    // 5. Search user accounts by keyword
    async searchUsers(keyword) {
        try {
            if (!keyword) {
                return { status: "ERR", message: "Keyword is required" };
            }
            const users = await UserModel.find({
                $or: [
                    { user_name: { $regex: keyword, $options: "i" } },
                    { email: { $regex: keyword, $options: "i" } },
                    { phone: { $regex: keyword, $options: "i" } }
                ]
            }).populate("role_id", "name");
            return { status: "OK", data: users };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    },

    // 6. Filter user accounts (by role, status, ...)
    async filterUsers(filters) {
        try {
            const query = {};
            if (filters.role) {
                const role = await RoleModel.findOne({ name: filters.role });
                if (role) query.role_id = role._id;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            // Có thể bổ sung thêm các filter khác nếu cần
            const users = await UserModel.find(query).populate("role_id", "name");
            return { status: "OK", data: users };
        } catch (error) {
            return { status: "ERR", message: error.message };
        }
    }
};

module.exports = UserService;
