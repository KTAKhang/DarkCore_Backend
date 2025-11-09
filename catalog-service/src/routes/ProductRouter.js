const express = require("express");
const ProductController = require("../controller/ProductController");
const { uploadProductImages } = require("../middleware/uploadMiddleware");
const { attachUserFromHeader, authAdminMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

// Public routes (không cần authentication)
router.get("/products/stats", attachUserFromHeader, authAdminMiddleware, ProductController.stats);
router.get("/products", attachUserFromHeader, authAdminMiddleware, ProductController.list);
router.get("/products/:id", attachUserFromHeader, authAdminMiddleware, ProductController.detail);

// Product management routes
router.post("/products", attachUserFromHeader, authAdminMiddleware, uploadProductImages, ProductController.create);
router.put("/products/:id", attachUserFromHeader, authAdminMiddleware, uploadProductImages, ProductController.update);
router.delete("/products/:id", attachUserFromHeader, authAdminMiddleware, ProductController.remove);


module.exports = router;


