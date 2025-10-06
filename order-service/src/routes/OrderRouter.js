const express = require("express");
const OrderController = require("../controller/OrderController");

const router = express.Router();

// Tạo đơn hàng mới
router.post("/orders", OrderController.createOrder);

// Lấy danh sách đơn hàng với phân trang, filter và sort
router.get("/orders", OrderController.getOrders);

// Lấy thống kê đơn hàng - PHẢI ĐỊNH NGHĨA TRƯỚC /orders/:id
router.get("/orders/stats", OrderController.getOrderStats);

// Lấy chi tiết đơn hàng theo ID - PHẢI ĐỊNH NGHĨA SAU các routes cụ thể
router.get("/orders/:id", OrderController.getOrderById);

// Cập nhật trạng thái đơn hàng
router.put("/orders/:id/status", OrderController.updateOrderStatus);

// Lấy danh sách trạng thái đơn hàng
router.get("/order-statuses", OrderController.getOrderStatuses);

module.exports = router;
