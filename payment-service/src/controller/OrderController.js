const OrderService = require("../service/OrderService");

const createOrder = async (req, res) => {
    try {
        // ✅ Log request body từ frontend
        console.log('🎯 Controller - Received req.body:', JSON.stringify(req.body, null, 2));
        console.log('🎯 Controller - Specific fields:', {
            receiverName: req.body.receiverName,
            receiverPhone: req.body.receiverPhone,
            receiverAddress: req.body.receiverAddress,
            note: req.body.note
        });
        
        const result = await OrderService.createOrder(req.body);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

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

// 🆕 Cập nhật trạng thái đơn hàng bằng orderId
const updateOrderStatusByOrderId = async (req, res) => {
    try {
        const { orderId, status, paymentMethod, transactionId } = req.body;
        const result = await OrderService.updateOrderStatusByOrderId(orderId, {
            status,
            paymentMethod,
            transactionId
        });
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// 🆕 Cập nhật thông tin đơn hàng
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await OrderService.updateOrder(id, req.body);
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

// 🆕 Lấy lịch sử đơn hàng của khách hàng
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

// ✅ Customer: Lấy chi tiết đơn hàng theo ID (chỉ xem được đơn hàng của chính họ)
const getOrderByIdForCustomer = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { userId } = req.query; // Hoặc lấy từ auth middleware: req.user.id
        
        if (!userId) {
            return res.status(400).json({ status: "ERR", message: "Thiếu userId" });
        }
        
        const result = await OrderService.getOrderByIdForCustomer(orderId, userId);
        const statusCode = result.status === "OK" ? 200 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    updateOrderStatus,
    updateOrderStatusByOrderId,
    getOrderStats,
    getOrderStatuses,
    getOrderHistory,
    getOrderByIdForCustomer,
};
