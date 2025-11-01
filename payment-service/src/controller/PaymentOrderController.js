const OrderService = require("../service/OrderService");

// Tạo đơn hàng từ thanh toán (sau khi thanh toán thành công)
const createOrderFromPayment = async (req, res) => {
    try {
        console.log("🛒 Creating order from payment with data:", JSON.stringify(req.body, null, 2));
        
        const { 
            userId, 
            items, 
            receiverName, 
            receiverPhone, 
            receiverAddress, 
            paymentMethod, 
            note,
            shippingFee = 0,
            discount = 0,
            totalPrice,
            txnRef, // VNPay transaction reference
            vnpayData // Optional: VNPay callback data for verification
        } = req.body;
        
        // Validation cơ bản
        if (!userId || !items || !receiverName || !receiverPhone || !receiverAddress || !paymentMethod) {
            return res.status(400).json({ 
                status: "ERR", 
                message: "Thiếu các trường bắt buộc: userId, items, receiverName, receiverPhone, receiverAddress, paymentMethod" 
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                status: "ERR", 
                message: "Items phải là mảng và không được rỗng" 
            });
        }

        // Validation từng item
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ 
                    status: "ERR", 
                    message: "Mỗi item phải có productId và quantity > 0" 
                });
            }
        }

        // ✅ Chuẩn bị data để tạo order
        const orderData = {
            userId,
            items,
            receiverName,
            receiverPhone,
            receiverAddress,
            paymentMethod,
            note,
            shippingFee,
            discount,
            totalPrice // Frontend đã tính sẵn
        };

        console.log("💾 Creating order with data:", JSON.stringify(orderData, null, 2));

        // Tạo order
        const result = await OrderService.createOrder(orderData);
        
        if (result.status === "OK") {
            console.log("✅ Order created successfully:", result.data._id);
            
            // ✅ Nếu thanh toán VNPay thành công, cập nhật paymentStatus
            if (paymentMethod === "vnpay" && vnpayData && vnpayData.vnp_ResponseCode === "00") {
                // Có thể cập nhật thêm transactionId từ VNPay
                console.log("💳 Updating payment status for order:", result.data._id);
            }
        }

        const statusCode = result.status === "OK" ? 201 : 400;
        return res.status(statusCode).json(result);
    } catch (error) {
        console.error("❌ Error creating order from payment:", error);
        return res.status(500).json({ status: "ERR", message: error.message });
    }
};

// Lấy thông tin đơn hàng theo ID
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

// Lấy lịch sử đơn hàng của user
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

// Cập nhật trạng thái đơn hàng
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

module.exports = {
    createOrderFromPayment,
    getOrderById,
    getOrderHistory,
    updateOrderStatus
};
