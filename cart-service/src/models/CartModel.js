const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product", // Liên kết với collection products
  },
  name: { type: String, required: true }, // Snapshot từ Product.name
  price: { type: Number, required: true }, // Snapshot từ Product.price
  quantity: { type: Number, required: true, min: 1 }, // Đảm bảo quantity >= 1
  image: { type: String }, // thêm field ảnh
});

const cartSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true, // Đảm bảo tránh lỗi E11000
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Liên kết với collection users (tùy chọn)
    },
    items: [CartItemSchema],
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "checked_out"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Virtual field tính số lượng sản phẩm khác nhau
cartSchema.virtual("sum").get(function () {
  return this.items.length;
});

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Cart", cartSchema);
