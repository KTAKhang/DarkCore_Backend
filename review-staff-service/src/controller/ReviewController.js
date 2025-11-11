const ReviewService = require("../services/ReviewService");

const createProductReview = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { product_id, order_detail_id, rating, review_content } = req.body;

        if (!product_id || !order_detail_id || !rating) {
            return res.status(400).json({
                status: "ERR",
                message: "Thiếu thông tin bắt buộc: product_id, order_detail_id, rating",
            });
        }

        const result = await ReviewService.createProductReview({
            user_id,
            product_id,
            order_detail_id,
            rating,
            review_content,
        });

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("createProductReview controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user._id;
        const { rating, review_content } = req.body;

        const result = await ReviewService.updateReview(id, { rating, review_content }, user_id);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("updateReview controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const getAllReviewsByUserId = async (req, res) => {
    try {
        const user_id = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await ReviewService.getAllReviewsByUserId(user_id, page, limit);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("getAllReviewsByUserId controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const getAllReviewsForStaff = async (req, res) => {
    try {
        const page = Number.isNaN(parseInt(req.query.page, 10)) ? 1 : Math.max(parseInt(req.query.page, 10), 1);
        const limitQuery = parseInt(req.query.limit, 10);
        const limit = Number.isNaN(limitQuery) ? 5 : Math.max(limitQuery, 1);
        const filters = {
            product_id: req.query.product_id,
            user_id: req.query.user_id,
            status: req.query.status,
            rating: req.query.rating,
            search: req.query.search,
            sort_order: req.query.sort_order || req.query.sort,
        };

        const result = await ReviewService.getAllReviewsForStaff(page, limit, filters);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("getAllReviewsForStaff controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const getProductReviewByOrderDetailId = async (req, res) => {
    try {
        const { order_detail_id } = req.params;

        const result = await ReviewService.getProductReviewByOrderDetailId(order_detail_id);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(404).json(result);
        }
    } catch (error) {
        console.error("getProductReviewByOrderDetailId controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await ReviewService.getProductReviews(product_id, page, limit);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("getProductReviews controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const getProductReviewsByOrderId = async (req, res) => {
    try {
        const { order_id } = req.params;

        const result = await ReviewService.getProductReviewsByOrderId(order_id);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("getProductReviewsByOrderId controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const getReviewDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await ReviewService.getReviewDetail(id);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(404).json(result);
        }
    } catch (error) {
        console.error("getReviewDetail controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
    }
};

const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined) {
            return res.status(400).json({
                status: "ERR",
                message: "Thiếu thông tin status",
            });
        }

        const result = await ReviewService.updateReviewStatus(id, status);

        if (result.status === "OK") {
            return res.status(200).json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error("updateReviewStatus controller error:", error);
        return res.status(500).json({
            status: "ERR",
            message: error.message || "Lỗi server",
        });
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

