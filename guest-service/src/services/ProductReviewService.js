const ProductReviewModel = require("../models/ProductReviewsModel");
const OrderDetailModel = require("../models/OrderDetailModel");
const OrderModel = require("../models/OrderModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const ProductModel = require("../models/ProductModel");
const UserModel = require("../models/UserModel");
const { default: mongoose } = require("mongoose");




async function getAllReviews(product_id, { rating, page = 1, limit = 5, sortBy = "newest" }) {
    try {
        if (!product_id || !mongoose.Types.ObjectId.isValid(product_id)) {
            throw new Error("ID sản phẩm không hợp lệ");
        }
        const productExists = await ProductModel.exists({ _id: product_id });
        if (!productExists) {
            throw new Error("Sản phẩm không tồn tại");
        }

        const filter = { product_id, status: true };

        const ratingNum = Number(rating);
        if (rating && rating !== "all" && !isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5)
            filter.rating = ratingNum;

        const skip = (page - 1) * limit;
        const sortOptions = {
            newest: { updatedAt: -1 },
            oldest: { updatedAt: 1 },
            lowest: { rating: 1, createdAt: -1 }
        };
        const sortOption = sortOptions[sortBy] || sortOptions.newest;

        // Truy vấn song song
        const [totalReviews, totalAllReviews, reviews] = await Promise.all([
            ProductReviewModel.countDocuments(filter),
            ProductReviewModel.countDocuments({ product_id, status: true }),
            ProductReviewModel.find(filter)
                .populate("user_id", "user_name avatar")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
        ]);

        // Lấy thống kê rating
        const ratingStats = await ProductReviewModel.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(product_id), status: true } },
            { $group: { _id: "$rating", count: { $sum: 1 } } }
        ]);

        const totalAll = ratingStats.reduce((sum, i) => sum + i.count, 0);
        const ratingMap = Object.fromEntries(ratingStats.map(r => [r._id, r.count]));
        const ratingCounts = [5, 4, 3, 2, 1].map(star => {
            const count = ratingMap[star] || 0;
            return {
                star,
                count,
                percentage: totalAll ? +(count / totalAll * 100).toFixed(1) : 0
            };
        });

        const totalStars = ratingCounts.reduce((sum, { star, count }) => sum + star * count, 0);
        const averageRating = totalAll ? +(totalStars / totalAll).toFixed(1) : 0;

        return {
            total: totalReviews,
            totalAllReviews,
            page,
            limit,
            hasMore: skip + reviews.length < totalReviews,
            averageRating,
            ratingCounts,
            reviews: reviews.map(r => ({
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
        throw new Error(error.message || "Lỗi khi lấy danh sách đánh giá");
    }
}



module.exports = {
    getAllReviews,

};
