const express = require("express");
const CategoryController = require("../controller/CategoryController");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");
const { attachUserFromHeader, authAdminOrSalesStaffMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/categories/stats", attachUserFromHeader, authAdminOrSalesStaffMiddleware,  CategoryController.stats);
router.get("/categories",attachUserFromHeader, authAdminOrSalesStaffMiddleware, CategoryController.list);
router.get("/categories/:id", attachUserFromHeader, authAdminOrSalesStaffMiddleware, CategoryController.detail);
router.post("/categories", attachUserFromHeader, authAdminOrSalesStaffMiddleware, uploadCategoryImage, CategoryController.create);
router.put("/categories/:id", attachUserFromHeader, authAdminOrSalesStaffMiddleware, uploadCategoryImage, CategoryController.update);
router.delete("/categories/:id", attachUserFromHeader, authAdminOrSalesStaffMiddleware, CategoryController.remove);

module.exports = router;