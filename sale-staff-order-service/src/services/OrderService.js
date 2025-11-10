const ProductReviewModel = require("../models/ProductReviewsModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const OrderModel = require("../models/OrderModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const ProductModel = require("../models/ProductModel");
const UserModel = require("../models/UserModel");
const { default: mongoose } = require("mongoose");


const getOrders = async ({ page = 1, limit = 5, search = "", status, sortBy = "createdAt_desc" }) => {
    try {
        const filter = {};

        if (search && search.trim() !== "") {
            const trimmed = search.trim();
            const searchRegex = new RegExp(trimmed, "i");
            const searchConditions = [];

            if (mongoose.Types.ObjectId.isValid(trimmed)) {
                searchConditions.push({ _id: new mongoose.Types.ObjectId(trimmed) });
            }

            if (!isNaN(trimmed)) {
                searchConditions.push({ orderNumber: { $regex: searchRegex } });
            }

            searchConditions.push({ receiverName: { $regex: searchRegex } });

            const matchingUsers = await UserModel.find({
                $or: [
                    { user_name: { $regex: searchRegex } },
                    { email: { $regex: searchRegex } },
                ],
            })
                .select("_id")
                .lean();

            if (matchingUsers?.length > 0) {
                const userIds = matchingUsers.map((u) => u._id);
                searchConditions.push({ userId: { $in: userIds } });
            }

            filter.$or = searchConditions;
        }

        if (status) {
            const foundStatus = await OrderStatusModel.findOne({
                name: status,
                status: true,
                isActive: true,
            }).select("_id");

            if (foundStatus) {
                filter.orderStatusId = foundStatus._id;
            } else {
                return {
                    status: "OK",
                    data: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                    },
                };
            }
        }

        let sortOption = { createdAt: -1 };

        if (sortBy && typeof sortBy === "string") {
            const [field, order] = sortBy.split("_");
            const sortFieldMap = {
                createdat: "createdAt",
                updatedat: "updatedAt",
                totalprice: "totalPrice",
            };

            const sortField = sortFieldMap[field?.toLowerCase()] || "createdAt";
            sortOption = { [sortField]: order === "asc" ? 1 : -1 };
        }

        const total = await OrderModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const currentPage = Math.max(1, page);

        const orders = await OrderModel.find(filter)
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color")
            .sort(sortOption)
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .lean();

        return {
            status: "OK",
            pagination: {
                page: currentPage,
                limit,
                total,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
            data: orders,

        };
    } catch (error) {
        console.error("Error in getOrders service:", error);
        return { status: "ERR", message: error.message || "Lỗi khi lấy danh sách đơn hàng" };
    }
};

const getOrderStats = async () => {
    try {
        const statuses = await OrderStatusModel.find({ status: true, isActive: true });
        const statusMap = {};
        statuses.forEach(status => {
            statusMap[status.name] = status._id;
        });

        const [total, pending, confirmed, processing, shipped, delivered, cancelled, returned] = await Promise.all([
            OrderModel.countDocuments({}),
            OrderModel.countDocuments({ orderStatusId: statusMap.pending }),
            OrderModel.countDocuments({ orderStatusId: statusMap.confirmed }),
            OrderModel.countDocuments({ orderStatusId: statusMap.processing }),
            OrderModel.countDocuments({ orderStatusId: statusMap.shipped }),
            OrderModel.countDocuments({ orderStatusId: statusMap.delivered }),
            OrderModel.countDocuments({ orderStatusId: statusMap.cancelled }),
            OrderModel.countDocuments({ orderStatusId: statusMap.returned })
        ]);

        return {
            status: "OK",
            data: {
                total,
                pending,
                confirmed,
                processing,
                shipped,
                delivered,
                cancelled,
                returned
            }
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getOrderById = async (id) => {
    try {
        const order = await OrderModel.findById(id)
            .populate("userId", "user_name email phone address")
            .populate("orderStatusId", "name description color");

        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        // Lấy chi tiết đơn hàng
        const orderDetails = await OrderDetailModel.find({ orderId: id })
            .populate("productId", "name images price")
            .lean();

        const orderObj = order.toObject();

        // ✅ Convert ObjectId thành string cho orderDetails
        const processedOrderDetails = orderDetails.map(detail => ({
            ...detail,
            productId: detail.productId ? detail.productId._id.toString() : null,
            orderId: detail.orderId.toString(),
            _id: detail._id.toString()
        }));

        orderObj.orderDetails = processedOrderDetails;

        return { status: "OK", data: orderObj };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getValidTransitions = () => ({
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing"],
    processing: ["shipped"],
    shipped: ["delivered"],
    delivered: ["returned"],
    cancelled: [],
    returned: []
});

const updateOrderStatus = async (id, payload) => {
    try {
        const { orderStatusId } = payload;

        if (!orderStatusId) {
            return { status: "ERR", message: "Thiếu orderStatusId" };
        }
        const newStatus = await OrderStatusModel.findById(orderStatusId);
        if (!newStatus) return { status: "ERR", message: "Không tìm thấy trạng thái" };

        const order = await OrderModel.findById(id).populate("orderStatusId");
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        const currentStatusName = order.orderStatusId.name;
        const newStatusName = newStatus.name;

        const validTransitions = getValidTransitions();

        if (currentStatusName === newStatusName) {
            return { status: "ERR", message: `Đơn hàng đã ở trạng thái ${newStatusName}` };
        }

        const allowedTransitions = validTransitions[currentStatusName];
        if (!allowedTransitions || !allowedTransitions.includes(newStatusName)) {
            return {
                status: "ERR",
                message: `Không thể chuyển từ trạng thái "${currentStatusName}" sang "${newStatusName}". Các trạng thái hợp lệ: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "không có"}`
            };
        }

        const updateData = { orderStatusId };
        if (newStatusName === "delivered") {
            updateData.deliveredAt = new Date();
        }

        if (newStatusName === "cancelled") {
            updateData.cancelledAt = new Date();
        }

        const updated = await OrderModel.findByIdAndUpdate(id, updateData, { new: true })
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color");

        return { status: "OK", message: "Trạng thái đơn hàng đã được cập nhật thành công", data: updated };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getOrderStatuses = async () => {
    try {
        const statuses = await OrderStatusModel.find({ status: true, isActive: true })
            .sort({ sortOrder: 1 });

        return { status: "OK", data: statuses };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    getOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStatuses,
    getOrderStats
};
