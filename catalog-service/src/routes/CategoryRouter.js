const express = require("express");
const CategoryController = require("../controller/CategoryController");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");
const { attachUserFromHeader, authAdminMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

// Public routes (không cần authentication)
router.get("/categories/stats", attachUserFromHeader, authAdminMiddleware, CategoryController.stats);
router.get("/categories", attachUserFromHeader, authAdminMiddleware, CategoryController.list);
router.get("/categories/:id", attachUserFromHeader, authAdminMiddleware, CategoryController.detail);

// Category management routes
router.post("/categories", attachUserFromHeader, authAdminMiddleware, uploadCategoryImage, CategoryController.create);
router.put("/categories/:id", attachUserFromHeader, authAdminMiddleware, uploadCategoryImage, CategoryController.update);
router.delete("/categories/:id", attachUserFromHeader, authAdminMiddleware, CategoryController.remove);

module.exports = router;