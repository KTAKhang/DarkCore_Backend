const mongoose = require("mongoose");
const OrderModel = require("../models/OrderModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const UserModel = require("../models/UserModel");
const ProductModel = require("../models/ProductModel");

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================

// ✅ Helper: Định nghĩa luồng chuyển trạng thái hợp lệ (DRY - Don't Repeat Yourself)
const getValidTransitions = () => ({
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing"],
    processing: ["shipped"],
    shipped: ["delivered"],
    delivered: ["returned"],
    cancelled: [],
    returned: []
});

// ============================================
// 🔄 SHARED FUNCTIONS (Có thể dùng cho cả Admin và Customer)
// ============================================

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

// ============================================
// 👨‍💼 ADMIN FUNCTIONS
// ============================================

// ✅ Admin: Lấy danh sách đơn hàng với phân trang, filter và sort
const getOrders = async (query = {}) => {
    try {
        // Validation và chuẩn hóa page, limit
        let page = Math.max(1, parseInt(query.page) || 1);
        let limit = Math.min(Math.max(1, parseInt(query.limit) || 5), 100); // Mặc định 5 items/trang
        
        const filter = {};
        
        // 🔍 Search theo mã đơn hàng (orderId/orderNumber) hoặc tên khách hàng (receiverName)
        // Hỗ trợ tìm kiếm một phần chuỗi, không phân biệt hoa thường
        if (query.search) {
            const searchTerm = query.search.trim();
            
            // Escape các ký tự đặc biệt trong regex để tránh lỗi
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Kiểm tra xem search term có phải là ObjectId hợp lệ không
            const isValidObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
            
            const searchConditions = [];
            
            // Search theo orderNumber (mã đơn hàng như ORD202501160001) - tìm một phần chuỗi
            searchConditions.push({ orderNumber: { $regex: escapedSearchTerm, $options: 'i' } });
            
            // Search theo _id: 
            // - Nếu là ObjectId hợp lệ thì tìm chính xác
            // - Nếu không, tìm một phần của ObjectId (convert _id sang string)
            if (isValidObjectId) {
                searchConditions.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
            } else {
                // Tìm một phần của ObjectId bằng cách convert _id sang string
                searchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: escapedSearchTerm,
                            options: "i"
                        }
                    }
                });
            }
            
            // Search theo tên khách hàng (receiverName) - tìm một phần chuỗi
            searchConditions.push({ receiverName: { $regex: escapedSearchTerm, $options: 'i' } });
            
            // Sử dụng $or để tìm kiếm theo bất kỳ điều kiện nào
            filter.$or = searchConditions;
        }
        
        // Filter theo userId nếu có (giữ lại cho trường hợp cần thiết)
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

        // Xử lý sort - hỗ trợ createdAt và totalPrice
        let sortOption = { createdAt: -1 }; // Mặc định mới nhất
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "createdat" || sortBy === "created" || sortBy === "orderdate") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "totalprice" || sortBy === "price") {
            sortOption = { totalPrice: sortOrder === "asc" ? 1 : -1 };
        }

        // ✅ Sử dụng lean() để get plain objects với populate
        const orders = await OrderModel.find(filter)
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(); // ✅ Thêm lean() để get plain objects
        
        // ✅ Tùy chọn: Lấy order details nếu cần (query.includeDetails=true)
        let ordersWithDetails = orders;
        if (query.includeDetails === "true" || query.includeDetails === true) {
            ordersWithDetails = await Promise.all(
                orders.map(async (order) => {
                    const orderDetails = await OrderDetailModel.find({ orderId: order._id })
                        .populate("productId", "name images price")
                        .lean();
                    
                    // Convert ObjectId thành string cho productId và orderId
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
        }
            
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

// ✅ Admin: Lấy chi tiết đơn hàng theo ID
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

// ✅ Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (id, payload) => {
    try {
        const { orderStatusId, note } = payload;
        
        if (!orderStatusId) {
            return { status: "ERR", message: "Thiếu orderStatusId" };
        }

        // Kiểm tra order tồn tại
        const order = await OrderModel.findById(id).populate("orderStatusId");
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        // Kiểm tra status tồn tại
        const newStatus = await OrderStatusModel.findById(orderStatusId);
        if (!newStatus) return { status: "ERR", message: "Không tìm thấy trạng thái" };

        const currentStatusName = order.orderStatusId.name;
        const newStatusName = newStatus.name;

        // ✅ Lấy luồng chuyển trạng thái hợp lệ
        const validTransitions = getValidTransitions();

        // ✅ Kiểm tra nếu status hiện tại giống status mới (không cần update)
        if (currentStatusName === newStatusName) {
            return { status: "ERR", message: `Đơn hàng đã ở trạng thái ${newStatusName}` };
        }

        // ✅ Kiểm tra luồng chuyển trạng thái
        const allowedTransitions = validTransitions[currentStatusName];
        if (!allowedTransitions || !allowedTransitions.includes(newStatusName)) {
            return { 
                status: "ERR", 
                message: `Không thể chuyển từ trạng thái "${currentStatusName}" sang "${newStatusName}". Các trạng thái hợp lệ: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "không có"}` 
            };
        }

        // Cập nhật trạng thái
        const updateData = { orderStatusId };
        if (note) updateData.note = note;
        
        // Nếu chuyển sang delivered, cập nhật deliveredAt
        if (newStatusName === "delivered") {
            updateData.deliveredAt = new Date();
        }
        
        // Nếu chuyển sang cancelled, cập nhật cancelledAt
        if (newStatusName === "cancelled") {
            updateData.cancelledAt = new Date();
            if (payload.cancelledReason) {
                updateData.cancelledReason = payload.cancelledReason;
            }
        }

        // Nếu chuyển sang returned, cập nhật thông tin
        if (newStatusName === "returned") {
            if (payload.returnReason) {
                updateData.note = `Lý do trả hàng: ${payload.returnReason}`;
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

// ✅ Admin: Lấy thống kê đơn hàng
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

// ✅ Shared: Lấy danh sách trạng thái đơn hàng (dùng chung cho Admin và Customer)
const getOrderStatuses = async () => {
    try {
        const statuses = await OrderStatusModel.find({ status: true, isActive: true })
            .sort({ sortOrder: 1 });
        
        return { status: "OK", data: statuses };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Admin: Lấy danh sách trạng thái tiếp theo hợp lệ cho một đơn hàng
const getNextValidStatuses = async (orderId) => {
    try {
        // Kiểm tra order tồn tại
        const order = await OrderModel.findById(orderId).populate("orderStatusId");
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        const currentStatusName = order.orderStatusId.name;

        // Lấy luồng chuyển trạng thái hợp lệ
        const validTransitions = getValidTransitions();

        const allowedStatusNames = validTransitions[currentStatusName] || [];
        
        // Lấy chi tiết các trạng thái hợp lệ
        const nextStatuses = await OrderStatusModel.find({ 
            name: { $in: allowedStatusNames },
            status: true,
            isActive: true
        }).sort({ sortOrder: 1 });

        return { 
            status: "OK", 
            data: {
                currentStatus: order.orderStatusId,
                nextValidStatuses: nextStatuses
            }
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ============================================
// 👤 CUSTOMER FUNCTIONS
// ============================================

// ✅ Customer: Lấy chi tiết đơn hàng theo ID (chỉ xem được đơn hàng của chính họ)
const getOrderByIdForCustomer = async (orderId, userId) => {
    try {
        // Kiểm tra order tồn tại và thuộc về user
        const order = await OrderModel.findOne({ _id: orderId, userId })
            .populate("userId", "user_name email phone address")
            .populate("orderStatusId", "name description color");
            
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này" };
        
        // Lấy chi tiết đơn hàng
        const orderDetails = await OrderDetailModel.find({ orderId })
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
        
        // ✅ Thông tin ngày có sẵn trong response:
        // - orderDate: Ngày tạo đơn hàng (Date)
        // - createdAt: Ngày tạo record (từ timestamps)
        // - deliveredAt: Ngày hoàn thành đơn hàng (nếu đã giao)
        // - cancelledAt: Ngày hủy đơn hàng (nếu bị hủy)
        // - updatedAt: Ngày cập nhật cuối cùng
        
        return { status: "OK", data: orderObj };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

// ✅ Customer: Lấy lịch sử đơn hàng của khách hàng với phân trang, filter và sort theo thời gian tạo
const getOrderHistory = async (userId, query = {}) => {
    try {
        // Validation userId bắt buộc cho customer
        if (!userId) {
            return { status: "ERR", message: "Thiếu userId" };
        }
        
        // Kiểm tra user tồn tại
        const user = await UserModel.findById(userId);
        if (!user) return { status: "ERR", message: "Không tìm thấy người dùng" };
        
        // Validation và chuẩn hóa page, limit
        let page = Math.max(1, parseInt(query.page) || 1);
        let limit = Math.min(Math.max(1, parseInt(query.limit) || 10), 100); // Mặc định 10 items/trang
        
        const filter = { userId }; // Chỉ lấy đơn hàng của customer này
        
        // 🔍 Search theo mã đơn hàng (orderId/orderNumber) hoặc tên khách hàng (receiverName)
        // Hỗ trợ tìm kiếm một phần chuỗi, không phân biệt hoa thường
        if (query.search) {
            const searchTerm = query.search.trim();
            
            // Escape các ký tự đặc biệt trong regex để tránh lỗi
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Kiểm tra xem search term có phải là ObjectId hợp lệ không
            const isValidObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
            
            const searchConditions = [];
            
            // Search theo orderNumber (mã đơn hàng như ORD202501160001) - tìm một phần chuỗi
            searchConditions.push({ orderNumber: { $regex: escapedSearchTerm, $options: 'i' } });
            
            // Search theo _id: 
            // - Nếu là ObjectId hợp lệ thì tìm chính xác
            // - Nếu không, tìm một phần của ObjectId (convert _id sang string)
            if (isValidObjectId) {
                searchConditions.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
            } else {
                // Tìm một phần của ObjectId bằng cách convert _id sang string
                searchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$_id" },
                            regex: escapedSearchTerm,
                            options: "i"
                        }
                    }
                });
            }
            
            // Search theo tên khách hàng (receiverName) - tìm một phần chuỗi
            searchConditions.push({ receiverName: { $regex: escapedSearchTerm, $options: 'i' } });
            
            // Sử dụng $or để tìm kiếm theo bất kỳ điều kiện nào
            filter.$or = searchConditions;
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

        // Xử lý sort - hỗ trợ createdAt và totalPrice
        let sortOption = { createdAt: -1 }; // Mặc định mới nhất
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "createdat" || sortBy === "created" || sortBy === "orderdate") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "totalprice" || sortBy === "price") {
            sortOption = { totalPrice: sortOrder === "asc" ? 1 : -1 };
        }

        // Lấy orders với populate
        const orders = await OrderModel.find(filter)
            .populate("orderStatusId", "name description color")
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
            
        // Lấy order details cho mỗi order
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderDetails = await OrderDetailModel.find({ orderId: order._id })
                    .populate("productId", "name images price")
                    .lean();
                
                // Convert ObjectId thành string
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
            message: "Lấy lịch sử đơn hàng thành công",
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

// ============================================
// 📦 EXPORTS
// ============================================

module.exports = {
    // Shared Functions
    createOrder,
    getOrderStatuses,
    
    // Admin Functions
    getOrders,                  // ✅ Admin: Pagination, sort, filter, search orders
    getOrderById,              // ✅ Admin: Read details orders
    updateOrderStatus,         // ✅ Admin: Update order status
    getOrderStats,            // ✅ Admin: Order statistics
    getNextValidStatuses,     // ✅ Admin: Get next valid statuses
    
    // Customer Functions
    getOrderHistory,          // ✅ Customer: View order history with pagination, sort, filter, search
    getOrderByIdForCustomer,  // ✅ Customer: Read details orders (only their own orders)
};
