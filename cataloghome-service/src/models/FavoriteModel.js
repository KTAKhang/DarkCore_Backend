const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: [true, "User ID là bắt buộc"],
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            required: [true, "Product ID là bắt buộc"],
        },
    },
    {
        timestamps: true,
    }
);

// Tạo compound index để đảm bảo mỗi user chỉ có thể favorite 1 product 1 lần
favoriteSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

const FavoriteModel = mongoose.model("favorites", favoriteSchema);
module.exports = FavoriteModel;

