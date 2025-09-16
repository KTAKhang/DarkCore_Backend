
const StaffService = require('../services/StaffService');

const updateStaffStatusController = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { status } = req.body;
        if (!staffId || !status) {
            return res.status(400).json({ status: "ERR", message: "User ID and status are required" });
        }
        const response = await StaffService.updateStaffStatus(staffId, status);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const createStaffController = async (req, res) => {
    try {
        // Đổi staff_name thành user_name nếu có
        const data = { ...req.body };
        if (data.staff_name && !data.user_name) {
            data.user_name = data.staff_name;
            delete data.staff_name;
        }
        const response = await StaffService.createStaff(data);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getStaffsController = async (req, res) => {
    try {
        const response = await StaffService.getStaffs();
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getStaffDetailsController = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await StaffService.getStaffDetails(id);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const searchStaffsController = async (req, res) => {
    try {
        const { keyword } = req.query;
        const response = await StaffService.searchStaffs(keyword);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const filterStaffsController = async (req, res) => {
    try {
        const filters = req.query;
        const response = await StaffService.filterStaffs(filters);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

module.exports = {
    updateStaffStatusController,
    createStaffController,
    getStaffsController,
    getStaffDetailsController,
    searchStaffsController,
    filterStaffsController
};
