const OrderModel = require("../models/OrderModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const UserModel = require("../models/UserModel");
const ProductModel = require("../models/ProductModel");

const createOrder = async (payload) => {
    try {
        const { userId, items, receiverName, receiverPhone, receiverAddress, paymentMethod, note } = payload;
        
        if (!userId || !items || !receiverName || !receiverPhone || !receiverAddress || !paymentMethod) {
            return { status: "ERR", message: "Thiếu các trường bắt buộc" };
        }

        // Kiểm tra user tồn tại
        const user = await UserModel.findById(userId);
        if (!user) return { status: "ERR", message: "Không tìm thấy người dùng" };

        // Lấy trạng thái pending mặc định
        const pendingStatus = await OrderStatusModel.findOne({ name: "pending", status: true, isActive: true });
        if (!pendingStatus) return { status: "ERR", message: "Không tìm thấy trạng thái pending" };

        // Tính toán tổng tiền
        let subtotal = 0;
        const orderDetails = [];
        
        for (const item of items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) return { status: "ERR", message: `Không tìm thấy sản phẩm với ID: ${item.productId}` };
            
            if (product.stockQuantity < item.quantity) {
                return { status: "ERR", message: `Sản phẩm ${product.name} không đủ số lượng trong kho` };
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderDetails.push({
                orderId: null, // Sẽ được cập nhật sau khi tạo order
                productId: product._id,
                productName: product.name,
                productImage: product.images && product.images.length > 0 ? product.images[0] : "",
                quantity: item.quantity,
                price: product.price,
                totalPrice: itemTotal,
                discount: item.discount || 0,
                note: item.note || ""
            });
        }

        const shippingFee = payload.shippingFee || 0;
        const discount = payload.discount || 0;
        const totalPrice = subtotal + shippingFee - discount;

        // Tạo order
        const order = await OrderModel.create({
            userId,
            subtotal,
            totalPrice,
            shippingFee,
            discount,
            orderStatusId: pendingStatus._id,
            paymentMethod,
            receiverName,
            receiverPhone,
            receiverAddress,
            note
        });

        // Tạo order details
        for (const detail of orderDetails) {
            detail.orderId = order._id;
            await OrderDetailModel.create(detail);
        }

        // Cập nhật số lượng sản phẩm trong kho
        for (const item of items) {
            await ProductModel.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: -item.quantity } }
            );
        }

        // Populate để trả về đầy đủ thông tin
        const populatedOrder = await OrderModel.findById(order._id)
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color");

        return { status: "OK", message: "Đơn hàng đã được tạo thành công", data: populatedOrder };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getOrders = async (query = {}) => {
    try {
        // Validation và chuẩn hóa page, limit
        let page = Math.max(1, parseInt(query.page) || 1);
        let limit = Math.min(Math.max(1, parseInt(query.limit) || 5), 100); // Mặc định 5 items/trang
        
        const filter = {};
        
        // Filter theo userId nếu có
        if (query.userId) {
            filter.userId = query.userId;
        }
        
        // Filter theo orderStatusId nếu có
        if (query.orderStatusId) {
            filter.orderStatusId = query.orderStatusId;
        }
        
        // Filter theo status name nếu có
        if (query.status) {
            const status = await OrderStatusModel.findOne({ name: query.status, status: true, isActive: true });
            if (status) {
                filter.orderStatusId = status._id;
            } else {
                // Không có status phù hợp => trả danh sách rỗng
                return { 
                    status: "OK", 
                    data: [], 
                    pagination: { 
                        page, 
                        limit, 
                        total: 0, 
                        totalPages: 0,
                        hasNextPage: false,
                        hasPrevPage: false
                    } 
                };
            }
        }

        // Xử lý sort theo thời gian
        let sortOption = { createdAt: -1 }; // Mặc định mới nhất
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "").toString().trim().toLowerCase();
        
        const validSortFields = ["createdat", "created", "orderdate", "default", "none"];
        const validSortOrders = ["asc", "desc"];
        
        const isValidSortBy = validSortFields.includes(sortBy);
        const isValidSortOrder = validSortOrders.includes(sortOrder);
        
        if (sortBy === "default" || sortBy === "none" || sortBy === "" || !sortBy || !isValidSortBy) {
            // Mặc định - mới nhất
            sortOption = { createdAt: -1 };
        } else if (isValidSortBy && isValidSortOrder) {
            if (sortBy === "createdat" || sortBy === "created" || sortBy === "orderdate") {
                sortOption = { createdAt: sortOrder === "desc" ? -1 : 1 };
            }
        }

        // ✅ Sử dụng lean() để get plain objects với populate
        const orders = await OrderModel.find(filter)
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(); // ✅ Thêm lean() để get plain objects
            
        // ✅ Lấy order details và convert ObjectId thành string
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderDetails = await OrderDetailModel.find({ orderId: order._id })
                    .populate("productId", "name images price")
                    .lean(); // ✅ Thêm lean() cho orderDetails cũng
                
                // ✅ Convert ObjectId thành string cho productId và orderId
                const processedOrderDetails = orderDetails.map(detail => ({
                    ...detail,
                    productId: detail.productId ? detail.productId._id.toString() : null,
                    orderId: detail.orderId.toString(),
                    _id: detail._id.toString()
                }));
                
                order.orderDetails = processedOrderDetails;
                return order;
            })
        );
            
        const total = await OrderModel.countDocuments(filter);
        
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return { 
            status: "OK", 
            data: ordersWithDetails, 
            pagination: { 
                page, 
                limit, 
                total, 
                totalPages,
                hasNextPage,
                hasPrevPage
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

const updateOrderStatus = async (id, payload) => {
    try {
        const { orderStatusId, note } = payload;
        
        if (!orderStatusId) {
            return { status: "ERR", message: "Thiếu orderStatusId" };
        }

        // Kiểm tra order tồn tại
        const order = await OrderModel.findById(id);
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        // Kiểm tra status tồn tại
        const status = await OrderStatusModel.findById(orderStatusId);
        if (!status) return { status: "ERR", message: "Không tìm thấy trạng thái" };

        // Cập nhật trạng thái
        const updateData = { orderStatusId };
        if (note) updateData.note = note;
        
        // Nếu chuyển sang delivered, cập nhật deliveredAt
        if (status.name === "delivered") {
            updateData.deliveredAt = new Date();
        }
        
        // Nếu chuyển sang cancelled, cập nhật cancelledAt
        if (status.name === "cancelled") {
            updateData.cancelledAt = new Date();
            if (payload.cancelledReason) {
                updateData.cancelledReason = payload.cancelledReason;
            }
        }

        const updated = await OrderModel.findByIdAndUpdate(id, updateData, { new: true })
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color");

        return { status: "OK", message: "Trạng thái đơn hàng đã được cập nhật thành công", data: updated };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const getOrderStats = async () => {
    try {
        // Lấy tất cả status trước
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
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    getOrderStatuses,
};
