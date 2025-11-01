const OrderService = require("../services/OrderService");


const getOrders = async (req, res) => {
    try {
        const { page, limit, search, status, sortBy } = req.query;

        // ✅ Chuẩn hóa & validate
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(Math.max(1, parseInt(limit) || 5), 100);
        const cleanSearch = search ? String(search).trim() : "";
        const cleanStatus = status ? String(status).trim() : undefined;
        const cleanSortBy =
            sortBy && typeof sortBy === "string" ? sortBy.trim().toLowerCase() : "createdat_desc";

        // ✅ Gọi service
        const result = await OrderService.getOrders({
            page: validPage,
            limit: validLimit,
            search: cleanSearch,
            status: cleanStatus,
            sortBy: cleanSortBy,
        });

        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        console.error("Error in getOrders controller:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi máy chủ khi lấy danh sách đơn hàng",
        });
    }
};
const getOrderStats = async (req, res) => {
    try {
        const result = await OrderService.getOrderStats();
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};


const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await OrderService.getOrderById(id);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await OrderService.updateOrderStatus(id, req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};


const getOrderStatuses = async (req, res) => {
    try {
        const result = await OrderService.getOrderStatuses();
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};


module.exports = {
    getOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStatuses,
    getOrderStats
};
