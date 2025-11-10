const StatisticsService = require("../services/StatisticsService");

// Get overview statistics
const getOverviewStatistics = async (req, res) => {
    try {
        const result = await StatisticsService.getOverviewStatistics();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get revenue by month
const getRevenueByMonth = async (req, res) => {
    try {
        const { year } = req.query;
        const result = await StatisticsService.getRevenueByMonth(
            parseInt(year) || new Date().getFullYear()
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get revenue by date
const getRevenueByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const result = await StatisticsService.getRevenueByDate(
            date || new Date().toISOString().split('T')[0]
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get new customers
const getNewCustomers = async (req, res) => {
    try {
        const { date } = req.query;
        const result = await StatisticsService.getNewCustomers(
            date || new Date().toISOString().split('T')[0]
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get sales by date
const getSalesByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const result = await StatisticsService.getSalesByDate(
            date || new Date().toISOString().split('T')[0]
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get top products
const getTopProducts = async (req, res) => {
    try {
        const { limit } = req.query;
        const result = await StatisticsService.getTopProducts(
            parseInt(limit) || 3
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get pending orders count
const getPendingOrdersCount = async (req, res) => {
    try {
        const result = await StatisticsService.getPendingOrdersCount();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get top customer trends
const getTopCustomerTrends = async (req, res) => {
    try {
        const { month, year, limit } = req.query;
        const result = await StatisticsService.getTopCustomerTrends(
            parseInt(month) || new Date().getMonth() + 1,
            parseInt(year) || new Date().getFullYear(),
            parseInt(limit) || 3
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get repair monthly revenue
const getRepairMonthlyRevenue = async (req, res) => {
    try {
        const { month, year } = req.query;
        const result = await StatisticsService.getRepairMonthlyRevenue(
            parseInt(month) || new Date().getMonth() + 1,
            parseInt(year) || new Date().getFullYear()
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get repair revenue by year (all 12 months)
const getRepairRevenueByYear = async (req, res) => {
    try {
        const { year } = req.query;
        const result = await StatisticsService.getRepairRevenueByYear(
            parseInt(year) || new Date().getFullYear()
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Get repair overview
const getRepairOverview = async (req, res) => {
    try {
        const result = await StatisticsService.getRepairOverview();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Export dashboard to Excel
const exportDashboardExcel = async (req, res) => {
    try {
        const { year } = req.query;
        const buffer = await StatisticsService.exportDashboardExcel(
            parseInt(year) || new Date().getFullYear()
        );
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=dashboard-statistics-${year || new Date().getFullYear()}.xlsx`);
        
        return res.send(buffer);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

module.exports = {
    getOverviewStatistics,
    getRevenueByMonth,
    getRevenueByDate,
    getNewCustomers,
    getSalesByDate,
    getTopProducts,
    getPendingOrdersCount,
    getTopCustomerTrends,
    getRepairMonthlyRevenue,
    getRepairRevenueByYear,
    getRepairOverview,
    exportDashboardExcel
};

