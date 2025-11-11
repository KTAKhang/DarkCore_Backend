const express = require("express");
const router = express.Router();
const StatisticsController = require("../controllers/StatisticsController");
const { attachUserFromHeader, authAdminMiddleware } = require("../middleware/authMiddleware");

// Áp dụng middleware kiểm tra quyền admin cho tất cả route
router.use(attachUserFromHeader, authAdminMiddleware);

// Overview statistics
router.get("/overview", StatisticsController.getOverviewStatistics);

// Revenue statistics
router.get("/revenue/monthly", StatisticsController.getRevenueByMonth);
router.get("/revenue/daily", StatisticsController.getRevenueByDate);

// Customer statistics
router.get("/customers/new", StatisticsController.getNewCustomers);
router.get("/customers/top-trends", StatisticsController.getTopCustomerTrends);

// Sales statistics
router.get("/sales/daily", StatisticsController.getSalesByDate);

// Product statistics
router.get("/products/top", StatisticsController.getTopProducts);

// Order statistics
router.get("/orders/pending-count", StatisticsController.getPendingOrdersCount);

// Repair statistics
router.get("/repair/monthly", StatisticsController.getRepairMonthlyRevenue);
router.get("/repair/yearly", StatisticsController.getRepairRevenueByYear);
router.get("/repair/overview", StatisticsController.getRepairOverview);

// Export
router.get("/export/excel", StatisticsController.exportDashboardExcel);

module.exports = router;

