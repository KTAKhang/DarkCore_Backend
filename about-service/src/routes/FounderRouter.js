const express = require("express");
const FounderController = require("../controller/FounderController");
const { uploadFounderAvatar } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Lấy danh sách Founders (Public)
router.get("/founders", FounderController.getFounders);

// Lấy chi tiết Founder theo ID (Public)
router.get("/founders/:id", FounderController.getFounderById);

// Tạo Founder mới (Admin) - với upload avatar
router.post("/admin/founders", uploadFounderAvatar, FounderController.createFounder);

// Lấy tất cả Founders cho Admin (bao gồm inactive)
router.get("/admin/founders", FounderController.getAllFoundersForAdmin);

// Lấy chi tiết Founder theo ID cho Admin
router.get("/admin/founders/:id", FounderController.getFounderByIdForAdmin);

// Cập nhật Founder - với upload avatar
router.put("/admin/founders/:id", uploadFounderAvatar, FounderController.updateFounder);

// Cập nhật thứ tự hiển thị
router.put("/admin/founders/:id/sort-order", FounderController.updateSortOrder);

// Xóa Founder (soft delete)
router.delete("/admin/founders/:id", FounderController.deleteFounder);

// Xóa vĩnh viễn Founder
router.delete("/admin/founders/:id/permanent", FounderController.permanentDeleteFounder);

module.exports = router;

