const express = require("express");
const SalesStatsController = require("../controller/SalesStatsController");

const router = express.Router();
const { attachUserFromHeader, authSaleStaffMiddleware } = require("../middleware/authMiddleware");

// 📊 Sales staff dashboard stats
router.get("/sales-stats/dashboard", attachUserFromHeader, authSaleStaffMiddleware, SalesStatsController.getDashboardStats);

module.exports = router;
