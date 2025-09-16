const express = require("express");
const CategoryController = require("../controller/CategoryController");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");
// const { authAdminMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/categories/stats", CategoryController.stats);
router.get("/categories", CategoryController.list);
router.get("/categories/:id", CategoryController.detail);
// Tạm comment authAdminMiddleware để test
router.post("/categories", uploadCategoryImage, CategoryController.create);
router.put("/categories/:id", uploadCategoryImage, CategoryController.update);
router.delete("/categories/:id", CategoryController.remove);

module.exports = router;