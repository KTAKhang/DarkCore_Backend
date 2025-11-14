const OrderModel = require("../models/OrderModel");
const OrderStatusModel = require("../models/OrderStatusModel");
const ProductReviewModel = require("../models/ProductReviewsModel");

const getStatusIdMap = async (names = []) => {
    if (!names.length) return {};
    const statuses = await OrderStatusModel.find({
        name: { $in: names },
        status: true,
        isActive: true,
    }).lean();

    return statuses.reduce((acc, status) => {
        acc[status.name] = status._id;
        return acc;
    }, {});
};

const getDashboardStats = async () => {
    try {
        const statusNames = ["pending", "delivered", "cancelled"];
        const statusIdMap = await getStatusIdMap(statusNames);

        const [totalOrders, pendingOrders, completedOrders, cancelledOrders] = await Promise.all([
            OrderModel.countDocuments({}),
            statusIdMap.pending ? OrderModel.countDocuments({ orderStatusId: statusIdMap.pending }) : 0,
            statusIdMap.delivered ? OrderModel.countDocuments({ orderStatusId: statusIdMap.delivered }) : 0,
            statusIdMap.cancelled ? OrderModel.countDocuments({ orderStatusId: statusIdMap.cancelled }) : 0,
        ]);

        const [totalReviews, pendingReviews, reportedReviews] = await Promise.all([
            ProductReviewModel.countDocuments({}),
            ProductReviewModel.countDocuments({ status: false }),
            ProductReviewModel.countDocuments({ isReported: true }),
        ]);

        const ratingAggregate = await ProductReviewModel.aggregate([
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const averageRating = ratingAggregate.length ? Number(ratingAggregate[0].averageRating.toFixed(2)) : 0;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const startOfWeek = new Date(startOfToday);
        const dayOfWeek = startOfWeek.getDay();
        const offsetToMonday = (dayOfWeek + 6) % 7;
        startOfWeek.setDate(startOfWeek.getDate() - offsetToMonday);

        const [reviewsToday, reviewsThisWeek] = await Promise.all([
            ProductReviewModel.countDocuments({
                createdAt: { $gte: startOfToday, $lte: now },
            }),
            ProductReviewModel.countDocuments({
                createdAt: { $gte: startOfWeek, $lte: now },
            }),
        ]);

        return {
            status: "OK",
            data: {
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    completed: completedOrders,
                    cancelled: cancelledOrders,
                },
                reviews: {
                    total: totalReviews,
                    pending: pendingReviews,
                    reported: reportedReviews,
                    ratingOverview: {
                        average: averageRating,
                        scale: 5,
                        reviewsToday,
                        reviewsThisWeek,
                    },
                },
            },
        };
    } catch (error) {
        return { status: "ERR", message: error.message };
    }
};

module.exports = {
    getDashboardStats,
};


