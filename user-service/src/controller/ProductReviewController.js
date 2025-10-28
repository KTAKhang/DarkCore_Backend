const ProductReviewService = require("../services/ProductReviewService");

const createReview = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { product_id, order_detail_id, rating, review_content } = req.body;

        // Kiểm tra thiếu dữ liệu
        if (!product_id || !order_detail_id || rating === undefined || !review_content) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin cần thiết để đánh giá"
            });
        }

        // Ép kiểu rating sang số
        const ratingValue = Number(rating);

        // Validation cho rating
        if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({
                success: false,
                message: "Giá trị rating không hợp lệ. Phải là số nguyên từ 1 đến 5."
            });
        }

        // Validation cho review_content
        const trimmedContent = (review_content || "").trim();



        if (trimmedContent.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Nội dung đánh giá không được vượt quá 500 ký tự."
            });
        }



        const result = await ProductReviewService.createProductReview({
            user_id,
            product_id,
            order_detail_id,
            rating: ratingValue,
            review_content: trimmedContent,
        });

        return res.status(201).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Tạo đánh giá thất bại"
        });
    }
};


const updateReview = async (req, res) => {
    try {
        const review_id = req.params.id;
        const updateData = req.body;
        const user_id = req.user._id;

        if (!review_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID đánh giá"
            });
        }

        // Ép kiểu rating sang số
        const ratingValue = Number(updateData.rating);

        // Validation cho rating
        if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({
                success: false,
                message: "Giá trị rating không hợp lệ. Phải là số nguyên từ 1 đến 5."
            });
        }

        // Validation cho review_content
        const trimmedContent = (updateData.review_content || "").trim();



        if (trimmedContent.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Nội dung đánh giá không được vượt quá 500 ký tự."
            });
        }

        // Cập nhật lại dữ liệu đã làm sạch
        updateData.rating = ratingValue;
        updateData.review_content = trimmedContent;

        const result = await ProductReviewService.updateReview(review_id, updateData, user_id);

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Cập nhật đánh giá thất bại"
        });
    }
};


const getProductReviewsByUserId = async (req, res) => {
    try {
        const user_id = req.user._id;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID người dùng"
            });
        }

        const reviews = await ProductReviewService.getAllReviewsByUserId(user_id);
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đánh giá thành công",
            data: reviews
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi máy chủ khi lấy đánh giá"
        });
    }
}

// controllers/ProductReviewController.js
const getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { rating, page, limit, sortBy } = req.query;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID sản phẩm"
            });
        }

        const data = await ProductReviewService.getAllReviews(product_id, {
            rating,
            page: Number(page) || 1,
            limit: Number(limit) || 5,
            sortBy
        });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đánh giá thành công",
            ...data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi máy chủ khi lấy đánh giá"
        });
    }
};

const getAllReviewsForAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const search = req.query.search ? String(req.query.search).trim() : "";
        const rating = req.query.rating ? Number(req.query.rating) : undefined;
        const status = req.query.status;
        const sortBy = req.query.sortBy === "asc" ? "asc" : "desc";

        const reviews = await ProductReviewService.getAllReviewsForAdmin({
            page,
            limit,
            search,
            rating,
            status,
            sortBy
        });

        return res.status(200).json({
            success: true,
            message: "Lấy tất cả đánh giá thành công",
            data: reviews
        });
    } catch (error) {
        console.error("Error in getAllReviewsForAdmin controller:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi máy chủ khi lấy đánh giá"
        });
    }
};



const getProductReviewByOrderDetailId = async (req, res) => {
    try {
        const { order_detail_id } = req.params;

        if (!order_detail_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID chi tiết đơn hàng"
            });
        }

        const review = await ProductReviewService.getProductReviewByOrderDetailId(order_detail_id);
        return res.status(200).json({
            success: true,
            message: "Lấy đánh giá thành công",
            data: review
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message || "Không tìm thấy đánh giá"
        });
    }
};

const getProductReviewsByOrderId = async (req, res) => {
    try {
        const { order_id } = req.params;
        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu ID đơn hàng"
            });
        }
        const reviews = await ProductReviewService.getProductReviewByOrderId(order_id);
        return res.status(200).json({
            success: true,
            message: "Lấy đánh giá theo đơn hàng thành công",
            data: reviews
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message || "Không tìm thấy đánh giá cho đơn hàng"
        });
    }
};

const getReviewDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await ProductReviewService.getReviewDetail(id);

        return res.status(200).json({
            success: true,
            message: "Lấy chi tiết đánh giá thành công",
            data: review
        });
    } catch (error) {
        console.error("Error in getReviewDetail controller:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi máy chủ khi lấy chi tiết đánh giá"
        });
    }
};

const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (status === undefined) {
            return res.status(400).json({
                success: false,
                message: "Thiếu giá trị status trong request body"
            });
        }
        const parsedStatus = (status === true || status === "true");

        const updatedReview = await ProductReviewService.updateReviewStatus(id, parsedStatus);

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái đánh giá thành công",
            data: updatedReview
        });
    } catch (error) {
        console.error("Error in updateReviewStatus controller:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi máy chủ khi cập nhật trạng thái đánh giá"
        });
    }
};



module.exports = {
    createReview,
    updateReview,
    getProductReviews,
    getAllReviewsForAdmin,
    getProductReviewsByUserId,
    getProductReviewByOrderDetailId,
    getProductReviewsByOrderId,
    getReviewDetail,
    updateReviewStatus
};
