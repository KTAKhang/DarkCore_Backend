const OrderService = require("../services/OrderService");

// ============================================
// 🔄 SHARED CONTROLLERS
// ============================================

const createOrder = async (req, res) => {
    try {
        const result = await OrderService.createOrder(req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ============================================
// 👨‍💼 ADMIN CONTROLLERS
// ============================================

const getOrders = async (req, res) => {
    try {
        const result = await OrderService.getOrders(req.query);
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

const getOrderStats = async (req, res) => {
    try {
        const result = await OrderService.getOrderStats();
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

// 🆕 Lấy danh sách trạng thái tiếp theo hợp lệ
const getNextValidStatuses = async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await OrderService.getNextValidStatuses(orderId);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ============================================
// 👤 CUSTOMER CONTROLLERS
// ============================================

// ✅ Customer: Lấy chi tiết đơn hàng theo ID (chỉ xem được đơn hàng của chính họ)
const getOrderByIdForCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.body?.userId; // Lấy userId từ token hoặc body
        
        if (!userId) {
            return res.status(400).json({ status: "ERR", message: "Thiếu userId" });
        }
        
        const result = await OrderService.getOrderByIdForCustomer(id, userId);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ✅ Customer: Lấy lịch sử đơn hàng của khách hàng
const getOrderHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await OrderService.getOrderHistory(userId, req.query);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// ============================================
// 📦 EXPORTS
// ============================================

module.exports = {
    // Shared Controllers
    createOrder,
    getOrderStatuses,
    
    // Admin Controllers
    getOrders,                  // ✅ Admin: Pagination, sort, filter, search orders
    getOrderById,              // ✅ Admin: Read details orders
    updateOrderStatus,         // ✅ Admin: Update order status
    getOrderStats,            // ✅ Admin: Order statistics
    getNextValidStatuses,     // ✅ Admin: Get next valid statuses
    
    // Customer Controllers
    getOrderHistory,          // ✅ Customer: View order history with pagination, sort, filter, search
    getOrderByIdForCustomer,  // ✅ Customer: Read details orders (only their own orders)
};
