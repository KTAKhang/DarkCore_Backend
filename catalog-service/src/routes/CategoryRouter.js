const express = require("express");
const CategoryController = require("../controller/CategoryController");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");
const { authAdminSalesMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (không cần authentication)
router.get("/categories/stats", CategoryController.stats);
router.get("/categories", CategoryController.list);
router.get("/categories/:id", CategoryController.detail);

// Category management routes (chỉ admin và sales-staff)
router.post("/categories", authAdminSalesMiddleware, uploadCategoryImage, CategoryController.create);
router.put("/categories/:id", authAdminSalesMiddleware, uploadCategoryImage, CategoryController.update);
router.delete("/categories/:id", authAdminSalesMiddleware, CategoryController.remove);

module.exports = router;