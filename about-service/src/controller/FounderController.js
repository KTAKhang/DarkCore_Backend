const FounderService = require("../services/FounderService");

// ============================================
// 🔄 SHARED CONTROLLERS
// ============================================

const getFounders = async (req, res) => {
    try {
        const result = await FounderService.getFounders(req.query);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getFounderById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await FounderService.getFounderById(id);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ============================================
// 👨‍💼 ADMIN CONTROLLERS
// ============================================

const createFounder = async (req, res) => {
    try {
        const result = await FounderService.createFounder(req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getAllFoundersForAdmin = async (req, res) => {
    try {
        const result = await FounderService.getAllFoundersForAdmin(req.query);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getFounderByIdForAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await FounderService.getFounderByIdForAdmin(id);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const updateFounder = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await FounderService.updateFounder(id, req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const updateSortOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;
        const result = await FounderService.updateSortOrder(id, sortOrder);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const permanentDeleteFounder = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await FounderService.permanentDeleteFounder(id);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ============================================
// 📦 EXPORTS
// ============================================

module.exports = {
    // Shared Controllers
    getFounders,                // ✅ Public: Lấy danh sách Founders (có pagination)
    getFounderById,             // ✅ Public: Lấy chi tiết Founder theo ID
    
    // Admin Controllers
    createFounder,              // ✅ Admin: Tạo Founder mới
    getAllFoundersForAdmin,     // ✅ Admin: Lấy tất cả Founders (có search, pagination)
    getFounderByIdForAdmin,     // ✅ Admin: Lấy chi tiết Founder (bao gồm ẩn)
    updateFounder,              // ✅ Admin: Cập nhật Founder
    updateSortOrder,            // ✅ Admin: Cập nhật thứ tự hiển thị
    permanentDeleteFounder      // ✅ Admin: Xóa vĩnh viễn Founder
};

