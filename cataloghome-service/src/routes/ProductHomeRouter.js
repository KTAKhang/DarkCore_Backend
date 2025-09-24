const express = require("express");
const ProductHomeController = require("../controller/ProductHomeController");

const router = express.Router();

// Routes cho guest và customer xem products ở trang home
router.get("/producthome", ProductHomeController.list);
router.get("/producthome/featured", ProductHomeController.featured);
router.get("/producthome/brands", ProductHomeController.brands);
router.get("/producthome/favorites", ProductHomeController.favorites); // Route lấy danh sách yêu thích
router.get("/producthome/:id", ProductHomeController.detail);
router.get("/producthome/category/:categoryId", ProductHomeController.getByCategory);
router.put("/producthome/:id/favorite", ProductHomeController.toggleFavorite); // Route toggle favorite

module.exports = router;