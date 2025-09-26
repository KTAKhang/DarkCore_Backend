const express = require("express");
const ProductController = require("../controller/ProductController");
const { uploadProductImages } = require("../middleware/uploadMiddleware");
const { authAdminSalesMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (không cần authentication)
router.get("/products/stats", ProductController.stats);
router.get("/products", ProductController.list);
router.get("/products/:id", ProductController.detail);

// Product management routes (chỉ admin và sales-staff)
router.post("/products", authAdminSalesMiddleware, uploadProductImages, ProductController.create);
router.put("/products/:id", authAdminSalesMiddleware, uploadProductImages, ProductController.update);
router.delete("/products/:id", authAdminSalesMiddleware, ProductController.remove);

module.exports = router;


