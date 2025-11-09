const express = require("express");
const AboutController = require("../controller/AboutController");
const { uploadAboutLogoAndImages } = require("../middleware/uploadMiddleware");
const { attachUserFromHeader,  authSaleStaffMiddleware, authCustomerMiddleware, authAdminMiddleware} = require("../middleware/authMiddleware");
const router = express.Router();

// Lấy thông tin About Us (Public)
router.get("/about", AboutController.getAboutInfo);

// Tạo hoặc cập nhật thông tin About Us (Admin) - với upload logo và images
router.post("/admin/about", attachUserFromHeader, authAdminMiddleware, uploadAboutLogoAndImages, AboutController.createOrUpdateAbout);

// Lấy thông tin About Us cho Admin (bao gồm inactive)
router.get("/admin/about", attachUserFromHeader, authAdminMiddleware, AboutController.getAboutInfoForAdmin);

// Cập nhật trạng thái About Us
router.put("/admin/about/status", attachUserFromHeader, authAdminMiddleware, AboutController.updateAboutStatus);

// Cập nhật thống kê
router.put("/admin/about/stats", attachUserFromHeader, authAdminMiddleware, AboutController.updateStats);

// Xóa thông tin About Us (soft delete)
router.delete("/admin/about", attachUserFromHeader, authAdminMiddleware, AboutController.deleteAbout);

module.exports = router;

