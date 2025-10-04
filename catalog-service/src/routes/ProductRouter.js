const express = require("express");
const ProductController = require("../controller/ProductController");
const { uploadProductImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public routes (không cần authentication)
router.get("/products/stats", ProductController.stats);
router.get("/products", ProductController.list);
router.get("/products/:id", ProductController.detail);

// Product management routes
router.post("/products", uploadProductImages, ProductController.create);
router.put("/products/:id", uploadProductImages, ProductController.update);
router.delete("/products/:id", ProductController.remove);

// ✅ Test endpoint để debug upload
router.post("/products/test-upload", uploadProductImages, (req, res) => {
    console.log(`🔍 Test upload - req.files:`, req.files);
    console.log(`🔍 Test upload - req.body:`, req.body);
    res.json({
        status: "OK",
        message: "Upload test successful",
        data: {
            files: req.files,
            body: req.body
        }
    });
});

module.exports = router;


