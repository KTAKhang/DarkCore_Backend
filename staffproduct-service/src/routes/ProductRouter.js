const express = require("express");
const ProductController = require("../controller/ProductController");
const { uploadProductImages } = require("../middleware/uploadMiddleware");
const { authRoleMiddleware, attachUserFromHeader } = require("../middleware/productAuth");
const router = express.Router();
router.use(attachUserFromHeader);
// Public routes (không cần authentication)
router.get("/product/stats", ProductController.stats);
router.get("/product", ProductController.list);
router.get("/product/:id", ProductController.detail);

// Product management routes
router.post("/", authRoleMiddleware(["admin", "sales-staff"]), uploadProductImages, ProductController.create);
router.put("/:id", authRoleMiddleware(["admin", "sales-staff"]), uploadProductImages, ProductController.update);
router.delete("/:id", authRoleMiddleware(["admin", "sales-staff"]), ProductController.remove);


module.exports = router;


 