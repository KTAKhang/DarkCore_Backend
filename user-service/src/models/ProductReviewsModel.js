const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "Người dùng là bắt buộc"],
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: [true, "Sản phẩm là bắt buộc"],
    },
    order_detail_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderdetails",
        required: [true, "Chi tiết đơn hàng là bắt buộc"],
    },
    rating: {
        type: Number,
        required: [true, "Đánh giá là bắt buộc"],
        min: [1, "Đánh giá thấp nhất là 1 sao"],
        max: [5, "Đánh giá cao nhất là 5 sao"],
    },
    review_content: {
        type: String,
        trim: true,
    },
    status: {
        type: Boolean,
        required: [true, "Trạng thái là bắt buộc"],
        default: true,
    },
}, {
    timestamps: true,
});

const ProductReviewModel = mongoose.model("product_reviews", productReviewSchema);
module.exports = ProductReviewModel;
