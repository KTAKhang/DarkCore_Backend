const express = require("express");
const AboutController = require("../controller/AboutController");
const { uploadAboutLogoAndImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Lấy thông tin About Us (Public)
router.get("/about", AboutController.getAboutInfo);

// Tạo hoặc cập nhật thông tin About Us (Admin) - với upload logo và images
router.post("/admin/about", uploadAboutLogoAndImages, AboutController.createOrUpdateAbout);

// Lấy thông tin About Us cho Admin (bao gồm inactive)
router.get("/admin/about", AboutController.getAboutInfoForAdmin);

// Cập nhật trạng thái About Us
router.put("/admin/about/status", AboutController.updateAboutStatus);

// Cập nhật thống kê
router.put("/admin/about/stats", AboutController.updateStats);

// Xóa thông tin About Us (soft delete)
router.delete("/admin/about", AboutController.deleteAbout);

module.exports = router;

