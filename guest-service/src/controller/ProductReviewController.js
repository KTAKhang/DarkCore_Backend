const ProductReviewService = require("../services/ProductReviewService");


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


module.exports = {
    getProductReviews,
};
