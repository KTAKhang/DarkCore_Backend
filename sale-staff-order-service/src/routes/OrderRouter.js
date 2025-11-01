const express = require("express");
const routerOrder = express.Router();
const OrderController = require("../controller/OrderController");
const { attachUserFromHeader, authSaleStaffMiddleware } = require("../middleware/authMiddleware");
routerOrder.use(attachUserFromHeader)

// Lấy danh sách đơn hàng với phân trang, filter và sort
routerOrder.get("/orders", authSaleStaffMiddleware, OrderController.getOrders);

routerOrder.get("/orders/stats", authSaleStaffMiddleware, OrderController.getOrderStats);

// Lấy chi tiết đơn hàng theo ID - PHẢI ĐỊNH NGHĨA SAU các routes cụ thể
routerOrder.get("/orders/:id", authSaleStaffMiddleware, OrderController.getOrderById);

// Cập nhật trạng thái đơn hàng
routerOrder.put("/orders/:id/status", authSaleStaffMiddleware, OrderController.updateOrderStatus);

// Lấy danh sách trạng thái đơn hàng
routerOrder.get("/order-statuses", authSaleStaffMiddleware, OrderController.getOrderStatuses);


module.exports = routerOrder;
