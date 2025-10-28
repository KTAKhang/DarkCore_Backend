const OrderStatusModel = require("../models/OrderStatusModel");

const initOrderStatuses = async () => {
    try {
        const statuses = [
            {
                name: "pending",
                description: "Đơn hàng chờ xử lý",
                color: "#F59E0B",
                sortOrder: 1,
                status: true,
                isActive: true
            },
            {
                name: "paid",
                description: "Đơn hàng đã thanh toán",
                color: "#10B981",
                sortOrder: 2,
                status: true,
                isActive: true
            },
            {
                name: "confirmed",
                description: "Đơn hàng đã xác nhận",
                color: "#3B82F6",
                sortOrder: 3,
                status: true,
                isActive: true
            },
            {
                name: "processing",
                description: "Đang xử lý đơn hàng",
                color: "#8B5CF6",
                sortOrder: 4,
                status: true,
                isActive: true
            },
            {
                name: "shipped",
                description: "Đã giao cho đơn vị vận chuyển",
                color: "#06B6D4",
                sortOrder: 5,
                status: true,
                isActive: true
            },
            {
                name: "delivered",
                description: "Đã giao hàng thành công",
                color: "#10B981",
                sortOrder: 6,
                status: true,
                isActive: true
            },
            {
                name: "cancelled",
                description: "Đơn hàng đã hủy",
                color: "#EF4444",
                sortOrder: 7,
                status: true,
                isActive: true
            },
            {
                name: "returned",
                description: "Đơn hàng đã trả lại",
                color: "#6B7280",
                sortOrder: 8,
                status: true,
                isActive: true
            }
        ];

        for (const status of statuses) {
            await OrderStatusModel.findOneAndUpdate(
                { name: status.name },
                status,
                { upsert: true, new: true }
            );
        }

        console.log("✅ Order statuses initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing order statuses:", error);
    }
};

module.exports = { initOrderStatuses };
