const express = require("express");
const routerOrder = express.Router();
const OrderController = require("../controller/OrderController");
const { attachUserFromHeader, authSaleStaffMiddleware } = require("../middleware/authMiddleware");
routerOrder.use(attachUserFromHeader)

routerOrder.get("/orders", authSaleStaffMiddleware, OrderController.getOrders);

routerOrder.get("/orders/stats", authSaleStaffMiddleware, OrderController.getOrderStats);

routerOrder.get("/orders/:id", authSaleStaffMiddleware, OrderController.getOrderById);

routerOrder.put("/orders/:id/status", authSaleStaffMiddleware, OrderController.updateOrderStatus);

routerOrder.get("/order-statuses", authSaleStaffMiddleware, OrderController.getOrderStatuses);


module.exports = routerOrder;
