const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        short_desc: { type: String, default: "", trim: true, maxlength: [200, "short_desc must be at most 200 characters"] },
        price: { type: Number, required: true, min: 0 },
        stockQuantity: { type: Number, required: true, min: 0 },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "categories", required: true },
        images: [{ type: mongoose.Schema.Types.Mixed }], // ✅ Cho phép bất kỳ kiểu dữ liệu nào
        imagePublicIds: [{ type: mongoose.Schema.Types.Mixed }], // ✅ Cho phép bất kỳ kiểu dữ liệu nào
        brand: { type: String, default: "", trim: true },
        detail_desc: { type: String, default: "", trim: true, maxlength: [1000, "detail_desc must be at most 1000 characters"] },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const ProductModel = mongoose.model("products", productSchema);
module.exports = ProductModel;



