const UserModel = require("../models/UserModel");
const mongoose = require("mongoose");

const updateUserStatus = async (id, status) => {
    try {

        const checkUser = await UserModel.findById(id);
        if (!checkUser) {
            return { status: "ERR", message: "Khách hàng không tồn tại!" };
        }

        const updateData = await UserModel.findByIdAndUpdate(
            id,
            { status: status },
            { new: true }
        ).populate("role_id", "name -_id");

        const dataOutput = {
            _id: updateData._id,
            user_name: updateData.user_name,
            email: updateData.email,
            role_name: updateData.role_id.name,
            status: updateData.status,
            createdAt: updateData.createdAt,
            updatedAt: updateData.updatedAt,
        };

        return {
            status: "OK",
            message: status ? "Mở khóa tài khoản thành công!" : "Khóa tài khoản thành công!",
            data: dataOutput,
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};



const getAllUser = (page, limit, search = "", filters = {}, sortOption = "desc") => {
    return new Promise(async (resolve, reject) => {
        try {
            let query = {};

            if (search) {
                const orConditions = [
                    { user_name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ];

                // Nếu search trùng với _id hợp lệ thì thêm vào query
                if (mongoose.Types.ObjectId.isValid(search)) {
                    orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
                }

                query = { $or: orConditions };
            }

            if (filters.isGoogleAccount !== undefined) {
                query.isGoogleAccount = filters.isGoogleAccount;
            }
            if (filters.status !== undefined) {
                query.status = filters.status;
            }

            const listUser = await UserModel.find(query)
                .populate({
                    path: "role_id",
                    select: "name -_id",
                    match: { name: "customer" },
                });

            let listUserData = listUser
                .filter(user => user.role_id) // chỉ lấy user có role = customer
                .map(user => ({
                    _id: user._id,
                    user_name: user.user_name,
                    email: user.email,
                    role_name: user.role_id.name,
                    isGoogleAccount: user.isGoogleAccount,
                    phone: user.phone,
                    address: user.address,
                    avatar: user.avatar,
                    status: user.status,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                }));

            // sort theo createdAt
            listUserData.sort((a, b) =>
                sortOption === "asc"
                    ? new Date(a.createdAt) - new Date(b.createdAt)
                    : new Date(b.createdAt) - new Date(a.createdAt)
            );

            // pagination
            const totalUser = listUserData.length;
            const totalActive = listUserData.filter(u => u.status === true).length;
            const totalInactive = listUserData.filter(u => u.status === false).length;
            const totalPage = limit ? Math.ceil(totalUser / limit) : 1;
            const currentPage = page || 1;
            const paginatedUsers = (page && limit)
                ? listUserData.slice((page - 1) * limit, page * limit)
                : listUserData;

            resolve({
                status: "OK",
                message: "Nhận thông tin tất cả khách hàng thành công!",
                data: {
                    total: {
                        currentPage,
                        totalUser,
                        totalPage,
                        totalActive,
                        totalInactive,
                    },
                    user: paginatedUsers,
                },
            });
        } catch (error) {
            reject(error);
        }
    });
};




const getUserById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userDetail = await UserModel.findById(id);
            if (!userDetail) {
                resolve({
                    status: "ERR",
                    message: "Khách hàng không tồn tại!",
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
                isGoogleAccount: dataUser.isGoogleAccount,
                phone: dataUser.phone,
                address: dataUser.address,
                avatar: dataUser.avatar,
                status: dataUser.status,
                createdAt: dataUser.createdAt,
                updatedAt: dataUser.updatedAt,
            };
            resolve({
                status: "OK",
                message: "Nhận thông tin khách hàng thành công!",
                data: dataOutput,
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    getAllUser,
    getUserById,
    updateUserStatus
};