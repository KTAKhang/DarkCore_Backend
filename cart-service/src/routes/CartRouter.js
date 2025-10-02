const express = require("express");
const router = express.Router();
const CartController = require("../controller/CartController");
<<<<<<< HEAD
// const { verifyToken } = require("../middleware/authCart");

router.get("/", CartController.getCart);
router.post("/items", CartController.addItem);
router.put("/items/:itemId", CartController.updateItem);
router.delete("/items/:itemId", CartController.removeItem);
router.delete("/", CartController.clearCart);
=======
const {
  attachUserFromHeader,
  authUserMiddleware,
  authRoleMiddleware,
} = require("../middleware/authCart");

// Áp dụng middleware parse x-user cho tất cả routes
router.use(attachUserFromHeader);
>>>>>>> 7250971 (cartDone)

// Lấy giỏ hàng
router.get("/", authUserMiddleware, CartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/add", authUserMiddleware, CartController.addItem);

// Cập nhật số lượng sản phẩm
router.put("/update/:productId", authUserMiddleware, CartController.updateItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete("/remove/:productId", authUserMiddleware, CartController.removeItem);

// Xóa toàn bộ giỏ hàng
router.delete("/clear", authUserMiddleware, CartController.clearCart);

module.exports = router;