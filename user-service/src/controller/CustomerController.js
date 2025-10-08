const CustomerService = require("../services/CustomerService");
const UserModel = require("../models/UserModel");

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined) {
            return res.status(400).json({
                status: "ERR",
                message: "Status is required (true/false)",
            });
        }

        const response = await CustomerService.updateUserStatus(id, status);

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

const getAllUser = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const filters = {
        isGoogleAccount: req.query.isGoogleAccount !== undefined ? req.query.isGoogleAccount === "true" : undefined,
        status: req.query.status !== undefined ? req.query.status === "true" : undefined,
    };

    const sortOption = req.query.sort || "desc"; // "asc" hoặc "desc"

    try {
        const result = await CustomerService.getAllUser(page, limit, search, filters, sortOption);
        res.json(result);
    } catch (err) {
        res.status(500).json({ status: "ERROR", message: err.message });
    }
};




const getUserById = async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                status: "ERR",
                message: "User ID is required",
            });
        }

        const response = await CustomerService.getUserById(id);

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


module.exports = {
    getAllUser,
    getUserById,
    updateUserStatus
};