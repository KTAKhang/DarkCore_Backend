const express = require("express");
const OrderController = require("../controller/OrderController");

const router = express.Router();
const { attachUserFromHeader, authAdminMiddleware, authCustomerMiddleware} = require("../middleware/authMiddleware");
// Tạo đơn hàng mới
router.post("/orders", attachUserFromHeader, authCustomerMiddleware, OrderController.createOrder);

// Lấy danh sách đơn hàng với phân trang, filter và sort
router.get("/orders", attachUserFromHeader, authAdminMiddleware, OrderController.getOrders);

// Lấy thống kê đơn hàng - PHẢI ĐỊNH NGHĨA TRƯỚC /orders/:id
router.get("/orders/stats", attachUserFromHeader, authAdminMiddleware, OrderController.getOrderStats);

// 🆕 Lấy lịch sử đơn hàng của khách hàng - PHẢI ĐỊNH NGHĨA TRƯỚC /orders/:id
router.get("/orders/history/:userId", attachUserFromHeader, authCustomerMiddleware, OrderController.getOrderHistory);

// Lấy chi tiết đơn hàng theo ID - PHẢI ĐỊNH NGHĨA SAU các routes cụ thể
router.get("/orders/:id", attachUserFromHeader, authAdminMiddleware, OrderController.getOrderById);

// Cập nhật trạng thái đơn hàng
router.put("/orders/:id/status", attachUserFromHeader, authAdminMiddleware, OrderController.updateOrderStatus);

// Lấy danh sách trạng thái đơn hàng
router.get("/order-statuses", attachUserFromHeader, authAdminMiddleware, OrderController.getOrderStatuses);

// 🆕 Lấy danh sách trạng thái tiếp theo hợp lệ cho một đơn hàng
router.get("/orders/:orderId/next-statuses", attachUserFromHeader, authAdminMiddleware, OrderController.getNextValidStatuses);

module.exports = router;
