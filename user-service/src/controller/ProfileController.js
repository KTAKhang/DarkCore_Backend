const ProfileService = require("../services/ProfileService");
const UserModel = require("../models/UserModel");

const checkRole = async (userID) => {
    try {
        const user = await UserModel.findById(userID).populate("role_id", "name -_id");

        if (!user || !user.role_id || !user.role_id.name) {
            return { status: "ERR", message: "User or role not found" };
        }

        return {
            status: "OK",
            role: user.role_id.name,
            id: user._id,
        };
    } catch (error) {
        return { status: "ERR", message: "Error checking user role", detail: error.message };
    }
};

const updateProfile = async (req, res) => {
    try {
        const id = req.user._id;
        const data = req.body;
        const file = req.file;


        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: "ERR", message: "Unauthorized" });
        }


        const userID = req.user._id;
        const roleResult = await checkRole(userID);

        if (roleResult.status === "ERR") {
            return res.status(404).json({ status: "ERR", message: roleResult.message });
        }

        if (roleResult.role !== "admin" && userID !== id) {
            return res
                .status(200)
                .json({ status: "ERR", message: "You are not authorized" });
        }

        if (!id) {
            return res.status(400).json({ status: "ERR", message: "User ID is required" });
        }

        const response = await ProfileService.updateProfile(id, data, file, roleResult.role);
        return res.status(200).json(response);

    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ status: "ERR", message: "Server error", detail: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const id = req.user._id;

        if (!id) {
            return res.status(400).json({
                status: "ERR",
                message: "User ID is required",
            });
        }

        const response = await ProfileService.getUserById(id);

        if (!response || response.status === "ERR") {
            return res.status(404).json({
                status: "ERR",
                message: response?.message || "User not found",
            });
        }

        return res.status(200).json({
            status: "OK",
            data: response.data || response,
        });
    } catch (error) {
        return res.status(500).json({
            status: "ERR",
            message: "Internal Server Error",
            detail: error.message,
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const userID = req.user._id;

        if (!old_password || !new_password) {
            return res.status(400).json({
                status: "ERR",
                message: "All fields are required",
            });
        }

        const isStrictPassword = (password) => {
            const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
            return regex.test(password);
        };

        if (!isStrictPassword(new_password)) {
            return res.status(400).json({
                status: "ERR",
                message:
                    "Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa và số",
            });
        }

        const response = await ProfileService.changePassword(
            userID,
            old_password,
            new_password
        );

        if (response.status === "ERR") {
            return res.status(400).json(response);
        }

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            status: "ERR",
            message: "Internal Server Error",
            detail: error.message,
        });
    }
};

module.exports = {
    checkRole,
    updateProfile,
    getUserById,
    changePassword,
};