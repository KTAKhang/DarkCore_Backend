const express = require("express");
const CategoryController = require("../controller/CategoryController");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public routes
router.get("/categories/stats", CategoryController.stats);
router.get("/categories", CategoryController.list);
router.get("/categories/:id", CategoryController.detail);

// Category management routes
router.post("/categories", uploadCategoryImage, CategoryController.create);
router.put("/categories/:id", uploadCategoryImage, CategoryController.update);
router.delete("/categories/:id", CategoryController.remove);

module.exports = router;