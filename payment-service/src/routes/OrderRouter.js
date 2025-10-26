const express = require("express");
const OrderController = require("../controller/OrderController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Tạo đơn hàng mới
router.post("/orders", authMiddleware, OrderController.createOrder);

// Lấy danh sách đơn hàng với phân trang, filter và sort
router.get("/orders", authMiddleware, OrderController.getOrders);

// Lấy thống kê đơn hàng - PHẢI ĐỊNH NGHĨA TRƯỚC /orders/:id
router.get("/orders/stats", authMiddleware, OrderController.getOrderStats);

// 🆕 Lấy lịch sử đơn hàng của khách hàng - PHẢI ĐỊNH NGHĨA TRƯỚC /orders/:id
router.get("/orders/history/:userId", authMiddleware, OrderController.getOrderHistory);

// Lấy chi tiết đơn hàng theo ID - PHẢI ĐỊNH NGHĨA SAU các routes cụ thể
router.get("/orders/:id", authMiddleware, OrderController.getOrderById);

// Cập nhật thông tin đơn hàng
router.put("/orders/:id", authMiddleware, OrderController.updateOrder);

// Cập nhật trạng thái đơn hàng
router.put("/orders/:id/status", authMiddleware, OrderController.updateOrderStatus);

// 🆕 Cập nhật trạng thái đơn hàng bằng orderId (cho thanh toán)
router.put("/update-order-status", authMiddleware, OrderController.updateOrderStatusByOrderId);

// Lấy danh sách trạng thái đơn hàng (không cần auth vì là dữ liệu công khai)
router.get("/order-statuses", OrderController.getOrderStatuses);

module.exports = router;
