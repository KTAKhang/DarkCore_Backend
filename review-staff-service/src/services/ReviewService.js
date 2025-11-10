const ProductReviewModel = require("../models/ProductReviewsModel");
const UserModel = require("../models/UserModel");
const ProductModel = require("../models/ProductModel");
const OrderModel = require("../models/OrderModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const mongoose = require("mongoose");

const createProductReview = async (data) => {
    try {
        const { user_id, product_id, order_detail_id, rating, review_content } = data;

        // Validate required fields
        if (!user_id || !product_id || !order_detail_id || !rating) {
            return {
                status: "ERR",
                message: "Thiếu thông tin bắt buộc",
            };
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return {
                status: "ERR",
                message: "Đánh giá phải từ 1 đến 5 sao",
            };
        }

        // Check if user exists
        const user = await UserModel.findById(user_id);
        if (!user) {
            return {
                status: "ERR",
                message: "Người dùng không tồn tại",
            };
        }

        // Check if product exists
        const product = await ProductModel.findById(product_id);
        if (!product) {
            return {
                status: "ERR",
                message: "Sản phẩm không tồn tại",
            };
        }

        // Check if order detail exists and belongs to user
        const orderDetail = await OrderDetailModel.findById(order_detail_id);
        if (!orderDetail) {
            return {
                status: "ERR",
                message: "Chi tiết đơn hàng không tồn tại",
            };
        }

        // Verify order belongs to user
        const order = await OrderModel.findById(orderDetail.orderId);
        if (!order || order.userId.toString() !== user_id.toString()) {
            return {
                status: "ERR",
                message: "Bạn không có quyền đánh giá đơn hàng này",
            };
        }

        // Check if review already exists for this order detail
        const existingReview = await ProductReviewModel.findOne({
            order_detail_id: order_detail_id,
        });

        if (existingReview) {
            return {
                status: "ERR",
                message: "Bạn đã đánh giá đơn hàng này rồi",
            };
        }

        // Create review
        const review = await ProductReviewModel.create({
            user_id,
            product_id,
            order_detail_id,
            rating,
            review_content: review_content || "",
            status: true,
        });

        const populatedReview = await ProductReviewModel.findById(review._id)
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price");

        return {
            status: "OK",
            message: "Tạo đánh giá thành công",
            data: populatedReview,
        };
    } catch (error) {
        console.error("createProductReview error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi tạo đánh giá",
        };
    }
};

const updateReview = async (reviewId, data, userId) => {
    try {
        const { rating, review_content } = data;

        // Find review
        const review = await ProductReviewModel.findById(reviewId);
        if (!review) {
            return {
                status: "ERR",
                message: "Đánh giá không tồn tại",
            };
        }

        // Check if user owns the review
        if (review.user_id.toString() !== userId.toString()) {
            return {
                status: "ERR",
                message: "Bạn không có quyền chỉnh sửa đánh giá này",
            };
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return {
                    status: "ERR",
                    message: "Đánh giá phải từ 1 đến 5 sao",
                };
            }
            review.rating = rating;
        }

        if (review_content !== undefined) {
            review.review_content = review_content;
        }

        await review.save();

        const updatedReview = await ProductReviewModel.findById(reviewId)
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price");

        return {
            status: "OK",
            message: "Cập nhật đánh giá thành công",
            data: updatedReview,
        };
    } catch (error) {
        console.error("updateReview error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi cập nhật đánh giá",
        };
    }
};

const getAllReviewsByUserId = async (userId, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const reviews = await ProductReviewModel.find({ user_id: userId })
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ProductReviewModel.countDocuments({ user_id: userId });

        return {
            status: "OK",
            message: "Lấy danh sách đánh giá thành công",
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("getAllReviewsByUserId error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi lấy danh sách đánh giá",
        };
    }
};

const getAllReviewsForStaff = async (page = 1, limit = 5, filters = {}) => {
    try {
        const sanitizedPage = Number.isNaN(parseInt(page, 10)) ? 1 : Math.max(parseInt(page, 10), 1);
        const sanitizedLimit = Number.isNaN(parseInt(limit, 10)) ? 5 : Math.max(parseInt(limit, 10), 1);
        const skip = (sanitizedPage - 1) * sanitizedLimit;

        const matchStage = {};

        if (filters.product_id) {
            if (!mongoose.Types.ObjectId.isValid(filters.product_id)) {
                return {
                    status: "ERR",
                    message: "product_id không hợp lệ",
                };
            }
            matchStage.product_id = new mongoose.Types.ObjectId(filters.product_id);
        }

        if (filters.user_id) {
            if (!mongoose.Types.ObjectId.isValid(filters.user_id)) {
                return {
                    status: "ERR",
                    message: "user_id không hợp lệ",
                };
            }
            matchStage.user_id = new mongoose.Types.ObjectId(filters.user_id);
        }

        if (filters.status !== undefined && filters.status !== "") {
            matchStage.status = filters.status === "true" || filters.status === true;
        }

        if (filters.rating) {
            const parsedRating = parseInt(filters.rating, 10);
            if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                return {
                    status: "ERR",
                    message: "rating phải nằm trong khoảng 1 đến 5",
                };
            }
            matchStage.rating = parsedRating;
        }

        if (filters.search && typeof filters.search === "string") {
            matchStage["product.name"] = { $regex: filters.search.trim(), $options: "i" };
        }

        const sortOrderParam = (filters.sort_order || filters.sort || "").toString().toLowerCase();
        const sortDirection = sortOrderParam === "oldest" || sortOrderParam === "asc" ? 1 : -1;

        const aggregationPipeline = [
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $lookup: {
                    from: "orderdetails",
                    localField: "order_detail_id",
                    foreignField: "_id",
                    as: "order_detail",
                },
            },
            {
                $unwind: {
                    path: "$order_detail",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: matchStage,
            },
            {
                $sort: {
                    "order_detail.createdAt": sortDirection,
                },
            },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: sanitizedLimit },
                        {
                            $project: {
                                _id: 1,
                                rating: 1,
                                review_content: 1,
                                status: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                user_id: {
                                    _id: "$user._id",
                                    user_name: "$user.user_name",
                                    email: "$user.email",
                                    avatar: "$user.avatar",
                                },
                                product_id: {
                                    _id: "$product._id",
                                    name: "$product.name",
                                    images: "$product.images",
                                },
                                order_detail_id: {
                                    _id: "$order_detail._id",
                                    productName: "$order_detail.productName",
                                    productImage: "$order_detail.productImage",
                                    quantity: "$order_detail.quantity",
                                    price: "$order_detail.price",
                                    createdAt: "$order_detail.createdAt",
                                    updatedAt: "$order_detail.updatedAt",
                                },
                            },
                        },
                    ],
                    totalCount: [
                        { $count: "count" },
                    ],
                },
            },
            {
                $addFields: {
                    total: {
                        $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
                    },
                },
            },
            {
                $project: {
                    data: 1,
                    total: 1,
                },
            },
        ];

        const aggregationResult = await ProductReviewModel.aggregate(aggregationPipeline);
        const resultData = aggregationResult[0] || { data: [], total: 0 };
        const totalDocuments = resultData.total || 0;
        const reviews = resultData.data || [];

        return {
            status: "OK",
            message: "Lấy danh sách đánh giá thành công",
            data: reviews,
            pagination: {
                page: sanitizedPage,
                limit: sanitizedLimit,
                total: totalDocuments,
                totalPages: Math.ceil(totalDocuments / sanitizedLimit),
            },
        };
    } catch (error) {
        console.error("getAllReviewsForStaff error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi lấy danh sách đánh giá",
        };
    }
};

const getProductReviewByOrderDetailId = async (orderDetailId) => {
    try {
        const review = await ProductReviewModel.findOne({
            order_detail_id: orderDetailId,
        })
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price");

        if (!review) {
            return {
                status: "ERR",
                message: "Không tìm thấy đánh giá cho chi tiết đơn hàng này",
            };
        }

        return {
            status: "OK",
            message: "Lấy đánh giá thành công",
            data: review,
        };
    } catch (error) {
        console.error("getProductReviewByOrderDetailId error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi lấy đánh giá",
        };
    }
};

const getProductReviews = async (productId, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        // Check if product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return {
                status: "ERR",
                message: "Sản phẩm không tồn tại",
            };
        }

        // Get only active reviews
        const reviews = await ProductReviewModel.find({
            product_id: productId,
            status: true,
        })
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ProductReviewModel.countDocuments({
            product_id: productId,
            status: true,
        });

        return {
            status: "OK",
            message: "Lấy danh sách đánh giá thành công",
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("getProductReviews error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi lấy danh sách đánh giá",
        };
    }
};

const getProductReviewsByOrderId = async (orderId) => {
    try {
        // Get all order details for this order
        const orderDetails = await OrderDetailModel.find({ orderId: orderId });
        const orderDetailIds = orderDetails.map((od) => od._id);

        // Get all reviews for these order details
        const reviews = await ProductReviewModel.find({
            order_detail_id: { $in: orderDetailIds },
        })
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price")
            .sort({ createdAt: -1 });

        return {
            status: "OK",
            message: "Lấy danh sách đánh giá thành công",
            data: reviews,
        };
    } catch (error) {
        console.error("getProductReviewsByOrderId error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi lấy danh sách đánh giá",
        };
    }
};

const getReviewDetail = async (reviewId) => {
    try {
        const review = await ProductReviewModel.findById(reviewId)
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price");

        if (!review) {
            return {
                status: "ERR",
                message: "Không tìm thấy đánh giá",
            };
        }

        return {
            status: "OK",
            message: "Lấy chi tiết đánh giá thành công",
            data: review,
        };
    } catch (error) {
        console.error("getReviewDetail error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi lấy chi tiết đánh giá",
        };
    }
};

const updateReviewStatus = async (reviewId, status) => {
    try {
        const review = await ProductReviewModel.findById(reviewId);
        if (!review) {
            return {
                status: "ERR",
                message: "Đánh giá không tồn tại",
            };
        }

        review.status = status === true || status === "true";
        await review.save();

        const updatedReview = await ProductReviewModel.findById(reviewId)
            .populate("user_id", "user_name email avatar")
            .populate("product_id", "name images")
            .populate("order_detail_id", "productName productImage quantity price");

        return {
            status: "OK",
            message: "Cập nhật trạng thái đánh giá thành công",
            data: updatedReview,
        };
    } catch (error) {
        console.error("updateReviewStatus error:", error);
        return {
            status: "ERR",
            message: error.message || "Lỗi khi cập nhật trạng thái đánh giá",
        };
    }
};

module.exports = {
    createProductReview,
    updateReview,
    getAllReviewsByUserId,
    getAllReviewsForStaff,
    getProductReviewByOrderDetailId,
    getProductReviews,
    getProductReviewsByOrderId,
    getReviewDetail,
    updateReviewStatus,
};

