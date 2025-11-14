const SalesStatsService = require("../services/SalesStatsService");

const getDashboardStats = async (req, res) => {
    try {
        const result = await SalesStatsService.getDashboardStats();
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

module.exports = {
    getDashboardStats,
};


