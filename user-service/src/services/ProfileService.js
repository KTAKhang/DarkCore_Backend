const UserModel = require("../models/UserModel");
const RoleModel = require("../models/RolesModel");
const cloudinary = require("../config/cloudinaryConfig");
const bcrypt = require("bcrypt");

const updateProfile = async (id, data, file, role) => {
    try {
        const checkUser = await UserModel.findById(id);
        if (!checkUser) {
            return { status: "ERR", message: "User does not exist" };
        }

        // Chặn user thường sửa thông tin nhạy cảm
        if (role !== "admin") {
            if (
                data.role ||
                data.status ||
                data.email
            ) {
                return {
                    status: "ERR",
                    message: "You are not allowed to change this information",
                };
            }
        }

        // Validate email nếu có
        if (data.email) {
            const userWithSameEmail = await UserModel.findOne({ email: data.email });
            if (userWithSameEmail && userWithSameEmail._id.toString() !== id) {
                return { status: "ERR", message: "Email already exists" };
            }
        }

        // Validate role nếu có
        let roleData;
        if (data.role) {
            roleData = await RoleModel.findOne({ name: data.role });
            if (!roleData) {
                return { status: "ERR", message: "Role not found" };
            } else {
                data.role_id = roleData._id;
            }
        }

        // Upload avatar nếu có
        if (file) {
            if (checkUser.avatar) {
                const oldImageId = checkUser.avatar.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(`avatars/${oldImageId}`);
            }

            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "avatars" },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                uploadStream.end(file.buffer);
            });

            data.avatar = uploadResult.secure_url;
        }

        // Validate phone
        if (data.phone) {
            const phoneRegex = /^[0-9]{9,11}$/; // 9–11 số
            if (!phoneRegex.test(data.phone)) {
                return { status: "ERR", message: "Invalid phone number format" };
            }
        }

        // Validate address
        if (data.address) {
            if (data.address.length > 200) {
                return { status: "ERR", message: "Address is too long (max 200 characters)" };
            }
        }


        // Update user
        const updateData = await UserModel.findByIdAndUpdate(
            id,
            {
                user_name: data.user_name || checkUser.user_name,
                email: data.email || checkUser.email,
                role_id: data.role_id || checkUser.role_id,
                avatar: data.avatar || checkUser.avatar,
                status: data.status || checkUser.status,
                phone: data.phone || checkUser.phone,
                address: data.address || checkUser.address,
            },
            { new: true }
        );

        const dataUser = await UserModel.findById(updateData._id).populate(
            "role_id",
            "name -_id"
        );

        const dataOutput = {
            _id: dataUser._id,
            user_name: dataUser.user_name,
            email: dataUser.email,
            phone: dataUser.phone,
            address: dataUser.address,
            role_name: dataUser.role_id.name,
            avatar: dataUser.avatar,
            status: dataUser.status,
            createdAt: dataUser.createdAt,
            updatedAt: dataUser.updatedAt,
        };

        return {
            status: "OK",
            message: "Update success",
            data: dataOutput,
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getUserById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userDetail = await UserModel.findById(id);
            if (!userDetail) {
                resolve({
                    status: "ERR",
                    message: "User does not exist",
                });
            }
            const dataUser = await UserModel.findById(userDetail._id).populate(
                "role_id",
                "name -_id"
            );

            const dataOutput = {
                _id: dataUser._id,
                user_name: dataUser.user_name,
                email: dataUser.email,
                role_name: dataUser.role_id.name,
                address: dataUser.address,
                phone: dataUser.phone,
                avatar: dataUser.avatar,
                status: dataUser.status,
                createdAt: dataUser.createdAt,
                updatedAt: dataUser.updatedAt,
            };
            if (!userDetail) {
                resolve({
                    status: "ERR",
                    message: "User does not exist",
                });
            }
            resolve({
                status: "OK",
                message: "Successfully get user",
                data: dataOutput,
            });
        } catch (error) {
            reject(error);
        }
    });
};

const changePassword = async (userID, old_password, new_password) => {
    try {
        const checkUser = await UserModel.findById(userID);
        if (!checkUser) {
            return { status: "ERR", message: "User does not exist" };
        }
        const checkPassword = bcrypt.compareSync(old_password, checkUser.password);
        if (!checkPassword) {
            return { status: "ERR", message: "Old password is incorrect" };
        }
        const isStrictPassword = (password) => {
            const regex = /^(?=.*[A-Z])(?=.*\d).{8,8}$/;
            return regex.test(password);
        };
        if (!isStrictPassword(new_password)) {
            return {
                status: "ERR",
                message:
                    "Password must contain at least 8 characters, including uppercase and number",
            };
        }
        const hash = bcrypt.hashSync(new_password, 10);
        const updateData = await UserModel.findByIdAndUpdate(
            userID,
            {
                password: hash,
            },
            { new: true }
        );
        const dataUser = await UserModel.findById(updateData._id).populate(
            "role_id",
            "name -_id"
        );
        const dataOutput = {
            _id: dataUser._id,
            email: dataUser.email,
            user_name: dataUser.user_name,
            password: dataUser.password,
            role_name: dataUser.role_id.name,
            avatar: dataUser.avatar,
            status: dataUser.status,
            createdAt: dataUser.createdAt,
            updatedAt: dataUser.updatedAt,
        };
        return {
            status: "OK",
            message: "Change password success",
            data: dataOutput,
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    updateProfile,
    getUserById,
    changePassword,
};

