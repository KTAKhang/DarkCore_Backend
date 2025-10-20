const ProductReviewModel = require("../models/ProductReviewsModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const OrderModel = require("../models/OrderModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const ProductModel = require("../models/ProductModel");
const UserModel = require("../models/UserModel");
const { default: mongoose } = require("mongoose");


async function createProductReview({ user_id, product_id, order_detail_id, rating, review_content }) {
    const orderDetail = await OrderDetailModel.findById(order_detail_id);
    if (!orderDetail || orderDetail.productId.toString() !== product_id.toString()) {
        throw new Error("Chi tiết đơn hàng hoặc sẳn phẩm không hợp lệ");
    }

    const order = await OrderModel.findById(orderDetail.orderId);
    if (!order || order.userId.toString() !== user_id.toString()) {
        throw new Error("Bạn không có quyền đánh giá đơn hàng này");
    }

    const deliveredStatus = await OrderStatusModel.findOne({ name: "delivered" });

    if (!deliveredStatus || order.orderStatusId.toString() !== deliveredStatus._id.toString()) {
        throw new Error("Chỉ có thể đánh giá sau khi đơn hàng đã giao thành công (DELIVERED)");
    }

    const existingReview = await ProductReviewModel.findOne({
        user_id,
        product_id,
        order_detail_id
    });

    if (existingReview) {
        throw new Error("Bạn đã đánh giá sản phẩm này rồi");
    }

    const newReview = await ProductReviewModel.create({
        user_id,
        product_id,
        order_detail_id,
        rating,
        review_content
    });

    return {
        success: true,
        message: "Đánh giá sản phẩm thành công",
        review: newReview
    };
}

async function updateReview(review_id, updateData, user_id) {
    const review = await ProductReviewModel.findById(review_id);
    if (!review) throw new Error("Không tìm thấy đánh giá");

    const updateFields = {};

    if (review.user_id.toString() !== user_id.toString()) {
        throw new Error("Bạn không có quyền chỉnh sửa đánh giá này");
    }
    if (updateData.rating) {
        if (updateData.rating < 1 || updateData.rating > 5) {
            throw new Error("Rating phải từ 1 đến 5");
        }
        updateFields.rating = updateData.rating;
    }
    if (typeof updateData.review_content === "string") {
        updateFields.review_content = updateData.review_content;
    }

    if (Object.keys(updateFields).length === 0) {
        throw new Error("Không có dữ liệu hợp lệ để cập nhật");
    }

    const updatedReview = await ProductReviewModel.findByIdAndUpdate(
        review_id,
        updateFields,
        { new: true }
    );

    return {
        success: true,
        message: "Cập nhật đánh giá thành công",
        review: updatedReview
    };
}


async function getAllReviews(product_id, { rating, page = 1, limit = 5, sortBy = "newest" }) {
    try {
        // ✅ Bộ lọc chính
        const filter = { product_id, status: true };
        if (rating && rating !== "all") {
            const ratingNumber = Number(rating);
            if (!isNaN(ratingNumber) && ratingNumber >= 1 && ratingNumber <= 5) {
                filter.rating = ratingNumber;
            }
        }

        const skip = (page - 1) * limit;

        // ✅ Sắp xếp
        let sortOption = { createdAt: -1 };
        switch (sortBy) {
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "lowest":
                sortOption = { rating: 1, createdAt: -1 };
                break;
        }

        // ✅ Tổng số review theo filter hiện tại
        const totalReviews = await ProductReviewModel.countDocuments(filter);

        // ✅ Tổng số review của sản phẩm (bỏ qua filter rating)
        const totalAllReviews = await ProductReviewModel.countDocuments({
            product_id,
            status: true
        });

        // ✅ Lấy danh sách review
        const reviews = await ProductReviewModel.find(filter)
            .populate("user_id", "user_name avatar")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        // ✅ Xử lý ObjectId cho aggregate
        let matchProductId;
        try {
            matchProductId = new mongoose.Types.ObjectId(product_id);
        } catch (err) {
            matchProductId = product_id;
        }

        // ✅ Thống kê số lượng đánh giá theo từng sao (1–5)
        const ratingStats = await ProductReviewModel.aggregate([
            { $match: { product_id: matchProductId, status: true } },
            { $group: { _id: "$rating", count: { $sum: 1 } } }
        ]);

        const totalAll = ratingStats.reduce((sum, item) => sum + item.count, 0);

        // ✅ Chuẩn hóa mảng kết quả
        const ratingCounts = [5, 4, 3, 2, 1].map((star) => {
            const found = ratingStats.find((r) => r._id === star);
            const count = found ? found.count : 0;
            return {
                star,
                count,
                percentage: totalAll
                    ? Number(((count / totalAll) * 100).toFixed(1))
                    : 0
            };
        });

        // ✅ Trung bình số sao
        const totalStars = ratingCounts.reduce(
            (sum, rc) => sum + rc.star * rc.count,
            0
        );
        const averageRating =
            totalAll > 0 ? Number((totalStars / totalAll).toFixed(1)) : 0;

        // ✅ Kết quả cuối
        return {
            total: totalReviews,           // số review theo filter hiện tại
            totalAllReviews,              // tổng tất cả review của sản phẩm
            page,
            limit,
            hasMore: skip + reviews.length < totalReviews,
            averageRating,
            ratingCounts,
            reviews: reviews.map((r) => ({
                _id: r._id,
                rating: r.rating,
                content: r.review_content,
                createdAt: r.createdAt,
                user: {
                    _id: r.user_id?._id,
                    name: r.user_id?.user_name,
                    avatar: r.user_id?.avatar
                }
            }))
        };
    } catch (error) {
        console.error("Error in getAllReviews:", error);
        throw new Error("Lỗi khi lấy danh sách đánh giá");
    }
}


async function getAllReviewsByUserId(user_id) {
    const reviews = await ProductReviewModel.find({ user_id, status: true })
        .populate("user_id", "full_name")
        .sort({ createdAt: -1 });
    return reviews.map(review => ({
        _id: review._id,
        product: {
            _id: review.product_id._id,
            name: review.product_id.name
        },
        rating: review.rating,
        content: review.review_content,
        createdAt: review.createdAt
    }));
}

async function getAllReviewsForAdmin({ page = 1, limit = 5, search = "", rating, status, sortBy = "desc" }) {
    try {
        const query = {};

        // ========== 🔍 Xử lý search ==========
        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), "i");
            const orConditions = [];

            // Nếu search là ObjectId hoặc chuỗi có thể là review_id
            if (search.length === 24) {
                orConditions.push({ _id: search });
            }

            // Nếu search là số, có thể là rating
            const isNumeric = !isNaN(search);
            if (isNumeric) {
                const ratingValue = Number(search);
                if (ratingValue >= 1 && ratingValue <= 5) {
                    orConditions.push({ rating: ratingValue });
                }
            }

            // Tìm theo user_name hoặc email
            const matchingUsers = await UserModel.find({
                $or: [
                    { user_name: { $regex: searchRegex } },
                    { email: { $regex: searchRegex } }
                ]
            }).select("_id").lean();

            if (matchingUsers && matchingUsers.length > 0) {
                const matchingUserIds = matchingUsers.map(u => u._id);
                orConditions.push({ user_id: { $in: matchingUserIds } });
            }

            if (orConditions.length > 0) {
                query.$or = orConditions;
            }
        }

        // ========== ⭐ Lọc theo rating ==========
        if (rating && !isNaN(rating)) {
            query.rating = Number(rating);
        }

        // ========== 🟢 Lọc theo status ==========
        if (status === "true" || status === "false") {
            query.status = status === "true";
        }

        // ========== 📊 Đếm tổng ==========
        const totalReview = await ProductReviewModel.countDocuments(query);
        const totalActive = await ProductReviewModel.countDocuments({ ...query, status: true });
        const totalInActive = await ProductReviewModel.countDocuments({ ...query, status: false });

        // ========== 📄 Tính phân trang ==========
        const totalPage = limit > 0 ? Math.ceil(totalReview / limit) : 1;
        const currentPage = page > 0 ? page : 1;

        // ========== ⏱️ Sort ==========
        const sortOption = sortBy === "asc" ? { updatedAt: 1 } : { updatedAt: -1 };

        // ========== 📦 Lấy dữ liệu ==========
        const reviews = await ProductReviewModel.find(query)
            .populate({
                path: "user_id",
                select: "user_name email avatar",
                options: { strictPopulate: false }
            })
            .populate({
                path: "product_id",
                select: "name",
                options: { strictPopulate: false }
            })
            .sort(sortOption)
            .skip((currentPage - 1) * limit)
            .limit(limit)
            .lean();

        // ========== 🧩 Format dữ liệu ==========
        const reviewList = reviews.map(review => {
            const user = review.user_id && typeof review.user_id === "object"
                ? review.user_id
                : { _id: review.user_id, user_name: "Unknown", email: "N/A", avatar: null };

            const product = review.product_id && typeof review.product_id === "object"
                ? review.product_id
                : { _id: review.product_id, name: "Unknown Product" };

            return {
                _id: review._id,
                product: {
                    _id: product._id,
                    name: product.name
                },
                user: {
                    _id: user._id,
                    user_name: user.user_name,
                    email: user.email,
                    avatar: user.avatar
                },
                rating: review.rating,
                content: review.review_content || "",
                status: review.status,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt
            };
        });

        return {
            total: {
                currentPage,
                totalReview,
                totalPage,
                totalActive,
                totalInActive
            },
            reviews: reviewList
        };

    } catch (error) {
        console.error("Error in getAllReviewsForAdmin service:", error);
        throw new Error(error.message || "Lỗi khi lấy danh sách đánh giá");
    }
}


async function getProductReviewByOrderDetailId(order_detail_id) {
    const review = await ProductReviewModel.findOne({ order_detail_id })
        .populate("user_id", "user_name")
        .populate("product_id", "name");

    if (!review) {
        throw new Error("Không tìm thấy đánh giá cho chi tiết đơn hàng này");
    }

    return {
        _id: review._id,
        product: {
            _id: review.product_id._id,
            name: review.product_id.name
        },
        user: {
            _id: review.user_id._id,
            name: review.user_id.full_name
        },
        rating: review.rating,
        content: review.review_content,
        status: review.status,
        createdAt: review.createdAt
    };
}

async function getProductReviewByOrderId(order_id) {
    // ✅ Kiểm tra ObjectId hợp lệ trước khi truy vấn
    if (!mongoose.Types.ObjectId.isValid(order_id)) {
        throw new Error("Không tìm thấy chi tiết đơn hàng cho order_id này");
    }
    const orderDetails = await OrderDetailModel.find({ orderId: order_id })
    if (!orderDetails || orderDetails.length === 0) {
        throw new Error("Không tìm thấy chi tiết đơn hàng cho order_id này");
    }
    const orderDetailIds = orderDetails.map(od => od._id);
    const reviews = await ProductReviewModel.find({ order_detail_id: { $in: orderDetailIds } })
    // 3️⃣ Tạo Map để tra nhanh review theo order_detail_id
    const reviewMap = new Map();
    reviews.forEach(review => {
        reviewMap.set(review.order_detail_id.toString(), review);
    });
    // 4️⃣ Duyệt qua từng orderDetail → ghép với review (nếu có)
    const result = orderDetails.map(od => {
        const review = reviewMap.get(od._id.toString());
        return {
            order_detail_id: od._id,
            product: {
                _id: od.productId,
                name: od.productName,
                image: od.productImage,
            },
            review: review
                ? {
                    _id: review._id,
                    rating: review.rating,
                    content: review.review_content,
                    status: review.status,
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt,
                }
                : null, // ❗ Không có review thì để null
        };
    });
    return result;
}

async function getReviewDetail(review_id) {
    try {
        if (!review_id) {
            throw new Error("Thiếu ID đánh giá");
        }

        const review = await ProductReviewModel.findById(review_id)
            .populate({
                path: "user_id",
                select: "user_name email avatar",
                options: { strictPopulate: false }
            })
            .populate({
                path: "order_detail_id",
                select: "productName productImage price",
                options: { strictPopulate: false }
            })
            .lean();

        if (!review) {
            throw new Error("Không tìm thấy đánh giá với ID này");
        }

        // 🧍 Xử lý dữ liệu user
        const user = review.user_id && typeof review.user_id === "object"
            ? review.user_id
            : {
                _id: review.user_id,
                user_name: "Unknown",
                email: "N/A",
                avatar: null
            };

        // 🛍️ Xử lý dữ liệu sản phẩm (thông qua order_detail_id)
        const orderDetail = review.order_detail_id && typeof review.order_detail_id === "object"
            ? review.order_detail_id
            : {
                _id: review.order_detail_id,
                productName: "Unknown Product",
                productImage: null,
                price: 0,

            };

        // 📦 Trả về chi tiết review đã format
        return {
            _id: review._id,
            product: {
                _id: orderDetail._id,
                name: orderDetail.productName,
                image: orderDetail.productImage,
                price: orderDetail.price || 0,

            },
            user: {
                _id: user._id,
                user_name: user.user_name,
                email: user.email,
                avatar: user.avatar
            },
            rating: review.rating,
            content: review.review_content || "",
            status: review.status,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        };

    } catch (error) {
        console.error("Error in getReviewDetail service:", error);
        throw new Error(error.message || "Lỗi khi lấy chi tiết đánh giá");
    }
}

// ✅ Cập nhật trạng thái review (ví dụ: duyệt / ẩn)
async function updateReviewStatus(review_id, newStatus) {
    try {
        if (!review_id) {
            throw new Error("Thiếu ID đánh giá");
        }

        // Kiểm tra kiểu dữ liệu hợp lệ
        if (typeof newStatus !== "boolean") {
            throw new Error("Trạng thái không hợp lệ (phải là true hoặc false)");
        }

        const updatedReview = await ProductReviewModel.findByIdAndUpdate(
            review_id,
            { status: newStatus },
            { new: true }
        )

        if (!updatedReview) {
            throw new Error("Không tìm thấy đánh giá để cập nhật");
        }

        // ✅ Chỉ return thông tin review
        return {
            _id: updatedReview._id,
            rating: updatedReview.rating,
            review_content: updatedReview.review_content,
            status: updatedReview.status,
            createdAt: updatedReview.createdAt,
            updatedAt: updatedReview.updatedAt,
        };

    } catch (error) {
        console.error("Error in updateReviewStatus service:", error);
        throw new Error(error.message || "Lỗi khi cập nhật trạng thái đánh giá");
    }
}




module.exports = {
    createProductReview,
    getAllReviews,
    updateReview,
    getAllReviewsForAdmin,
    getAllReviewsByUserId,
    getProductReviewByOrderDetailId,
    getProductReviewByOrderId,
    getReviewDetail,
    updateReviewStatus
};
