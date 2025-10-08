const mongoose = require("mongoose");

// Schema cho CartItem (riêng biệt, ref đến Cart và Product)
const CartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Cart", // Quan hệ 1-n: Một Cart có nhiều CartItem
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product", // Quan hệ n-1: Nhiều CartItem ref đến một Product
    },
    name: { type: String, required: true }, // Snapshot từ Product.name
    price: { type: Number, required: true }, // Snapshot từ Product.price
    quantity: { type: Number, required: true, min: 1 }, // Đảm bảo quantity >= 1
    image: { type: String }, // Snapshot ảnh từ Product
  },
  { timestamps: true }
);

// Index để tối ưu query theo cartId và productId
CartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true }); // Tránh duplicate item trong cùng cart

// Model cho CartItem
const CartItem = mongoose.model("CartItem", CartItemSchema);

// Schema cho Cart (riêng biệt, ref đến User)
const CartSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true, // Đảm bảo tránh lỗi E11000
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users", // Quan hệ 1-1: Một User có một Cart active (hoặc n-1 nếu multiple carts, nhưng giữ 1-1 cho đơn giản)
      unique: true, // Giả sử mỗi user chỉ có một cart active
    },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "checked_out"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Virtual để tính số lượng sản phẩm khác nhau (populate items từ CartItem)
CartSchema.virtual("sum", {
  ref: "CartItem",
  localField: "_id",
  foreignField: "cartId",
  match: { cartId: this._id }, // Chỉ lấy items của cart này
  count: true, // Trả về số lượng items
});

// Virtual để populate items đầy đủ (tùy chọn, dùng khi cần chi tiết)
CartSchema.virtual("items", {
  ref: "CartItem",
  localField: "_id",
  foreignField: "cartId",
  match: { cartId: this._id },
  options: { sort: { createdAt: -1 } }, // Sắp xếp mới nhất
});

// Cấu hình toJSON/toObject để include virtuals
CartSchema.set("toJSON", { virtuals: true });
CartSchema.set("toObject", { virtuals: true });
module.exports = {
  Cart: mongoose.model("Cart", CartSchema),
  CartItem: CartItem,
};
