const express = require("express");
const PaymentOrderController = require("../controller/PaymentOrderController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Tạo đơn hàng từ thanh toán
router.post("/create-order", authMiddleware, PaymentOrderController.createOrderFromPayment);

// Lấy thông tin đơn hàng theo ID
router.get("/order/:id", authMiddleware, PaymentOrderController.getOrderById);

// Lấy lịch sử đơn hàng của user
router.get("/order-history/:userId", authMiddleware, PaymentOrderController.getOrderHistory);

// Cập nhật trạng thái đơn hàng
router.put("/order/:id/status", authMiddleware, PaymentOrderController.updateOrderStatus);

module.exports = router;
