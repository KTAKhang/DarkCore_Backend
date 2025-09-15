// Tách controller user
const UserService = require('../services/UserService');

const updateUserStatusController = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!userId || !status) {
            return res.status(400).json({ status: "ERR", message: "User ID and status are required" });
        }
        const response = await UserService.updateUserStatus(userId, status);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const createStaffController = async (req, res) => {
    try {
        const response = await UserService.createStaff(req.body);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getUsersController = async (req, res) => {
    try {
        const response = await UserService.getUsers();
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getUserDetailsController = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await UserService.getUserDetails(id);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const searchUsersController = async (req, res) => {
    try {
        const { keyword } = req.query;
        const response = await UserService.searchUsers(keyword);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const filterUsersController = async (req, res) => {
    try {
        const filters = req.query;
        const response = await UserService.filterUsers(filters);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

module.exports = {
    updateUserStatusController,
    createStaffController,
    getUsersController,
    getUserDetailsController,
    searchUsersController,
    filterUsersController
};
