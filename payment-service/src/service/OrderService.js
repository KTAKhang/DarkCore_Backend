const OrderModel = require("../models/OrderModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const UserModel = require("../models/UserModel");
const ProductModel = require("../models/ProductModel");

const createOrder = async (payload) => {
    try {
        // ✅ Log payload gốc từ frontend
        console.log('📥 Received payload:', JSON.stringify(payload, null, 2));
        
        // ✅ Hỗ trợ cả snake_case và camelCase từ frontend
        const userId = payload.userId || payload.user_id;
        const items = payload.items;
        const receiverName = payload.receiverName || payload.receiver_name || payload.receiverinfo?.name;
        const receiverPhone = payload.receiverPhone || payload.receiver_phone || payload.receiverinfo?.phone;
        const receiverAddress = payload.receiverAddress || payload.receiver_address || payload.receiverinfo?.address;
        const paymentMethod = payload.paymentMethod || payload.payment_method;
        const note = payload.note || payload.notes || "";
        
        // ✅ Log các field sau khi destructure
        console.log('📋 Destructured fields:', {
            userId,
            receiverName,
            receiverPhone,
            receiverAddress,
            paymentMethod,
            note,
            itemsCount: items ? items.length : 0
        });
        
        if (!userId || !items || !receiverName || !receiverPhone || !receiverAddress) {
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
            
            // ✅ Log để debug thông tin product và images
            console.log('📦 Product Info:', {
                productId: product._id,
                productName: product.name,
                images: product.images,
                imagesLength: product.images ? product.images.length : 0,
                firstImage: product.images && product.images.length > 0 ? product.images[0] : "NO IMAGE"
            });
            
            if (product.stockQuantity < item.quantity) {
                return { status: "ERR", message: `Sản phẩm ${product.name} không đủ số lượng trong kho` };
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            // ✅ Lấy ảnh đầu tiên từ product, nếu không có thì để rỗng
            const productImage = product.images && product.images.length > 0 ? product.images[0] : "";
            
            console.log('🖼️  Product Image to be saved:', productImage);

            orderDetails.push({
                orderId: null, // Sẽ được cập nhật sau khi tạo order
                productId: product._id,
                productName: product.name,
                productImage: productImage,
                quantity: item.quantity,
                price: product.price,
                totalPrice: itemTotal,
                discount: item.discount || 0,
                note: item.note || ""
            });
        }

        const shippingFee = payload.shippingFee || 0;
        const discount = payload.discount || 0;
        const totalPrice = payload.totalPrice || (subtotal + shippingFee - discount);
        
        // Log để debug
        console.log('OrderService createOrder:', {
            subtotal,
            shippingFee,
            discount,
            totalPrice,
            payloadTotalPrice: payload.totalPrice
        });

        // ✅ Log data trước khi tạo order
        const orderData = {
            userId,
            subtotal,
            totalPrice,
            shippingFee,
            discount,
            orderStatusId: pendingStatus._id,
            paymentMethod: paymentMethod || 'vnpay',
            receiverName,
            receiverPhone,
            receiverAddress,
            note
        };
        
        console.log('💾 Data to create Order:', JSON.stringify(orderData, null, 2));
        
        // Tạo order
        const order = await OrderModel.create(orderData);

        // Tạo order details
        console.log('💾 Creating OrderDetails with data:', JSON.stringify(orderDetails, null, 2));
        
        for (const detail of orderDetails) {
            detail.orderId = order._id;
            const createdDetail = await OrderDetailModel.create(detail);
            
            console.log('✅ OrderDetail created:', {
                _id: createdDetail._id,
                productName: createdDetail.productName,
                productImage: createdDetail.productImage,
                quantity: createdDetail.quantity
            });
        }

        // Cập nhật số lượng sản phẩm trong kho
        for (const item of items) {
            await ProductModel.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: -item.quantity } }
            );
        }

        // ✅ Log order sau khi tạo
        console.log('✅ Order created in DB:', {
            _id: order._id,
            receiverName: order.receiverName,
            receiverPhone: order.receiverPhone,
            receiverAddress: order.receiverAddress,
            note: order.note
        });
        
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
                // ✅ Ưu tiên sử dụng productImage đã lưu, nếu không có thì lấy từ productId.images
                const processedOrderDetails = orderDetails.map(detail => ({
                    ...detail,
                    productId: detail.productId ? detail.productId._id.toString() : null,
                    orderId: detail.orderId.toString(),
                    _id: detail._id.toString(),
                    // ✅ Đảm bảo productImage luôn có giá trị (ưu tiên từ OrderDetail, fallback sang Product)
                    productImage: detail.productImage || 
                                 (detail.productId && detail.productId.images && detail.productId.images.length > 0 
                                  ? detail.productId.images[0] 
                                  : "")
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
        // ✅ Ưu tiên sử dụng productImage đã lưu, nếu không có thì lấy từ productId.images
        const processedOrderDetails = orderDetails.map(detail => ({
            ...detail,
            productId: detail.productId ? detail.productId._id.toString() : null,
            orderId: detail.orderId.toString(),
            _id: detail._id.toString(),
            // ✅ Đảm bảo productImage luôn có giá trị (ưu tiên từ OrderDetail, fallback sang Product)
            productImage: detail.productImage || 
                         (detail.productId && detail.productId.images && detail.productId.images.length > 0 
                          ? detail.productId.images[0] 
                          : "")
        }));
        
        orderObj.orderDetails = processedOrderDetails;
        
        return { status: "OK", data: orderObj };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

const updateOrder = async (id, payload) => {
    try {
        const { receiverName, receiverPhone, receiverAddress, note } = payload;
        
        // Kiểm tra order tồn tại
        const order = await OrderModel.findById(id);
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        // Cập nhật thông tin
        const updateData = {};
        if (receiverName) updateData.receiverName = receiverName;
        if (receiverPhone) updateData.receiverPhone = receiverPhone;
        if (receiverAddress) updateData.receiverAddress = receiverAddress;
        if (note !== undefined) updateData.note = note;

        const updated = await OrderModel.findByIdAndUpdate(id, updateData, { new: true })
            .populate("userId", "user_name email phone")
            .populate("orderStatusId", "name description color");

        return { status: "OK", message: "Thông tin đơn hàng đã được cập nhật thành công", data: updated };
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

// 🆕 Cập nhật trạng thái đơn hàng bằng orderId
const updateOrderStatusByOrderId = async (orderId, payload) => {
    try {
        const { status, paymentMethod, transactionId } = payload;
        
        if (!status) {
            return { status: "ERR", message: "Thiếu trạng thái" };
        }

        // Kiểm tra order tồn tại bằng orderId
        const order = await OrderModel.findOne({ _id: orderId });
        if (!order) return { status: "ERR", message: "Không tìm thấy đơn hàng" };

        // Tìm trạng thái theo tên
        const orderStatus = await OrderStatusModel.findOne({ name: status, status: true, isActive: true });
        if (!orderStatus) return { status: "ERR", message: "Không tìm thấy trạng thái" };

        // Cập nhật trạng thái và thông tin thanh toán
        const updateData = { 
            orderStatusId: orderStatus._id,
            paymentMethod: paymentMethod || order.paymentMethod
        };
        
        if (transactionId) {
            updateData.transactionId = transactionId;
        }
        
        // Nếu chuyển sang paid, cập nhật paidAt và paymentStatus
        if (status === "paid") {
            updateData.paidAt = new Date();
            updateData.paymentStatus = "paid";
        }
        
        // Nếu chuyển sang delivered, cập nhật deliveredAt
        if (status === "delivered") {
            updateData.deliveredAt = new Date();
        }
        
        // Nếu chuyển sang cancelled, cập nhật cancelledAt
        if (status === "cancelled") {
            updateData.cancelledAt = new Date();
        }

        const updated = await OrderModel.findByIdAndUpdate(orderId, updateData, { new: true })
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

// 🆕 Lấy lịch sử đơn hàng của khách hàng
const getOrderHistory = async (userId, query = {}) => {
    try {
        // Kiểm tra user tồn tại
        const user = await UserModel.findById(userId);
        if (!user) return { status: "ERR", message: "Không tìm thấy người dùng" };

        // Validation và chuẩn hóa page, limit
        let page = Math.max(1, parseInt(query.page) || 1);
        let limit = Math.min(Math.max(1, parseInt(query.limit) || 10), 100); // Mặc định 10 items/trang
        
        const filter = { userId }; // Chỉ lấy đơn hàng của user này
        
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

        // Filter theo khoảng thời gian nếu có
        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate) {
                filter.createdAt.$gte = new Date(query.startDate);
            }
            if (query.endDate) {
                const endDate = new Date(query.endDate);
                endDate.setHours(23, 59, 59, 999); // Set to end of day
                filter.createdAt.$lte = endDate;
            }
        }

        // Xử lý sort - mặc định mới nhất trên cùng
        let sortOption = { createdAt: -1 };
        const sortBy = (query.sortBy ?? "").toString().trim().toLowerCase();
        const sortOrder = (query.sortOrder ?? "desc").toString().trim().toLowerCase();
        
        if (sortBy === "createdAt" || sortBy === "orderDate") {
            sortOption = { createdAt: sortOrder === "asc" ? 1 : -1 };
        } else if (sortBy === "totalPrice") {
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
                // ✅ Ưu tiên sử dụng productImage đã lưu, nếu không có thì lấy từ productId.images
                const processedOrderDetails = orderDetails.map(detail => ({
                    ...detail,
                    productId: detail.productId ? detail.productId._id.toString() : null,
                    orderId: detail.orderId.toString(),
                    _id: detail._id.toString(),
                    // ✅ Đảm bảo productImage luôn có giá trị (ưu tiên từ OrderDetail, fallback sang Product)
                    productImage: detail.productImage || 
                                 (detail.productId && detail.productId.images && detail.productId.images.length > 0 
                                  ? detail.productId.images[0] 
                                  : "")
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
        // ✅ Ưu tiên sử dụng productImage đã lưu, nếu không có thì lấy từ productId.images
        const processedOrderDetails = orderDetails.map(detail => ({
            ...detail,
            productId: detail.productId ? detail.productId._id.toString() : null,
            orderId: detail.orderId.toString(),
            _id: detail._id.toString(),
            // ✅ Đảm bảo productImage luôn có giá trị (ưu tiên từ OrderDetail, fallback sang Product)
            productImage: detail.productImage || 
                         (detail.productId && detail.productId.images && detail.productId.images.length > 0 
                          ? detail.productId.images[0] 
                          : "")
        }));
        
        orderObj.orderDetails = processedOrderDetails;
        
        return { status: "OK", data: orderObj };
    } catch (error) {
        return { status: "ERR", message: error.message };
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
