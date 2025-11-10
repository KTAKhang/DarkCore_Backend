const express = require("express");
const FavoriteController = require("../controller/FavoriteController");
const { attachUserFromHeader, authSaleStaffMiddleware, authCustomerMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Tất cả các routes yêu cầu user phải đăng nhập
router.use(attachUserFromHeader, authCustomerMiddleware);

// Lấy danh sách sản phẩm yêu thích của user
router.get("/favorites", FavoriteController.getFavorites);

// Kiểm tra sản phẩm có trong danh sách yêu thích không
router.get("/favorites/check/:productId", FavoriteController.checkFavorite);

// Kiểm tra nhiều sản phẩm (batch check)
router.post("/favorites/check-multiple", FavoriteController.checkMultipleFavorites);

// Toggle favorite (thêm/xóa)
router.post("/favorites/toggle/:productId", FavoriteController.toggleFavorite);

// Thêm vào yêu thích
router.post("/favorites", FavoriteController.addFavorite);

// Xóa khỏi yêu thích
router.delete("/favorites/:productId", FavoriteController.removeFavorite);

module.exports = router;

