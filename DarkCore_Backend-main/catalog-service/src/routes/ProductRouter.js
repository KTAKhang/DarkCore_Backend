const express = require("express");
const ProductController = require("../controller/ProductController");
// const { authAdminMiddleware } = require("../middleware/authMiddleware");
const { uploadProductImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/products/stats", ProductController.stats);
router.get("/products", ProductController.list);
router.get("/products/:id", ProductController.detail);
// Tạm tắt auth để test tạo sản phẩm tương tự Category
router.post("/products", uploadProductImages, ProductController.create);
router.put("/products/:id", uploadProductImages, ProductController.update);
router.delete("/products/:id", ProductController.remove);

module.exports = router;


