const express = require("express");
const FounderController = require("../controller/FounderController");
const { uploadFounderAvatar } = require("../middleware/uploadMiddleware");
const { attachUserFromHeader,  authSaleStaffMiddleware, authCustomerMiddleware, authAdminMiddleware} = require("../middleware/authMiddleware");
const router = express.Router();

// ============================================
// 🔄 PUBLIC ROUTES
// ============================================

// Lấy danh sách Founders (Public) - Có pagination: ?page=1&limit=10
router.get("/founders",  FounderController.getFounders);

// Lấy chi tiết Founder theo ID (Public)
router.get("/founders/:id", FounderController.getFounderById);

// ============================================
// 👨‍💼 ADMIN ROUTES
// ============================================

// Tạo Founder mới (Admin) - với upload avatar
router.post("/admin/founders", attachUserFromHeader, authAdminMiddleware, uploadFounderAvatar, FounderController.createFounder);

// Lấy tất cả Founders cho Admin - Có search, filter, pagination: ?search=name&status=true&page=1&limit=3
router.get("/admin/founders", attachUserFromHeader, authAdminMiddleware, FounderController.getAllFoundersForAdmin);

// Lấy chi tiết Founder theo ID cho Admin
router.get("/admin/founders/:id", attachUserFromHeader, authAdminMiddleware, FounderController.getFounderByIdForAdmin);

// Cập nhật Founder - với upload avatar
router.put("/admin/founders/:id", attachUserFromHeader, authAdminMiddleware, uploadFounderAvatar, FounderController.updateFounder);

// Cập nhật thứ tự hiển thị
router.put("/admin/founders/:id/sort-order", attachUserFromHeader, authAdminMiddleware, FounderController.updateSortOrder);

// Xóa Founder vĩnh viễn
router.delete("/admin/founders/:id", attachUserFromHeader, authAdminMiddleware, FounderController.permanentDeleteFounder);

module.exports = router;

