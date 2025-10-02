const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    short_desc: { type: String }, // mô tả ngắn
    detail_desc: { type: String }, // mô tả chi tiết
    price: { type: Number, required: true },
    stockQuantity: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // 👉 bổ sung trường ảnh
    images: [{ type: String }], // danh sách URL ảnh
    imagePublicIds: [{ type: String }], // id ảnh trên cloud

    brand: { type: String },
    favorite: { type: Boolean, default: false },
    status: { type: Boolean, default: true }, // true: còn bán, false: ẩn
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
