const AboutService = require("../services/AboutService");

// ============================================
// 🔄 SHARED CONTROLLERS
// ============================================

const getAboutInfo = async (req, res) => {
    try {
        const result = await AboutService.getAboutInfo();
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ============================================
// 👨‍💼 ADMIN CONTROLLERS
// ============================================

const createOrUpdateAbout = async (req, res) => {
    try {
        const result = await AboutService.createOrUpdateAbout(req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const getAboutInfoForAdmin = async (req, res) => {
    try {
        const result = await AboutService.getAboutInfoForAdmin();
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const updateAboutStatus = async (req, res) => {
    try {
        const result = await AboutService.updateAboutStatus(req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const updateStats = async (req, res) => {
    try {
        const result = await AboutService.updateStats(req.body.stats);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const deleteAbout = async (req, res) => {
    try {
        const result = await AboutService.deleteAbout();
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
    getAboutInfo,              // ✅ Public: Lấy thông tin About Us
    
    // Admin Controllers
    createOrUpdateAbout,       // ✅ Admin: Tạo hoặc cập nhật thông tin About Us
    getAboutInfoForAdmin,      // ✅ Admin: Xem thông tin (bao gồm ẩn)
    updateAboutStatus,         // ✅ Admin: Cập nhật trạng thái hiển thị
    updateStats,               // ✅ Admin: Cập nhật thống kê
    deleteAbout                // ✅ Admin: Xóa (ẩn)
};

