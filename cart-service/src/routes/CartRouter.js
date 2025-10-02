const express = require("express");
const router = express.Router();
const CartController = require("../controller/CartController");
const {
  attachUserFromHeader,
  authUserMiddleware,
  authRoleMiddleware,
} = require("../middleware/authCart");

// Áp dụng middleware parse x-user cho tất cả routes
router.use(attachUserFromHeader);

// Lấy giỏ hàng
router.get("/", authRoleMiddleware("customer"), CartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/add", authRoleMiddleware("customer"), CartController.addItem);

// Cập nhật số lượng sản phẩm
router.put("/update/:productId", authRoleMiddleware("customer"), CartController.updateItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete(
  "/remove/:productId",
  authRoleMiddleware("customer"),
  CartController.removeItem
);

// Xóa toàn bộ giỏ hàng
router.delete("/clear", authRoleMiddleware("customer"), CartController.clearCart);

module.exports = router;
