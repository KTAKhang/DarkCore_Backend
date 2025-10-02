// const mongoose = require("mongoose");

// const CartItemSchema = new mongoose.Schema({
//   productId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   quantity: { type: Number, required: true },
// });

// const CartSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     items: [CartItemSchema],
//   },
//   { timestamps: true }
// );

// CartSchema.virtual("sum").get(function () {
//   return this.items.length;
// });

// CartSchema.set("toJSON", { virtuals: true });
// CartSchema.set("toObject", { virtuals: true });

// module.exports = mongoose.model("Cart", CartSchema);
const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
<<<<<<< HEAD
    ref: "product",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
=======
    required: true,
    ref: "Product", // Liên kết với collection products
  },
  name: { type: String, required: true }, // Snapshot từ Product.name
  price: { type: Number, required: true }, // Snapshot từ Product.price
  quantity: { type: Number, required: true, min: 1 }, // Đảm bảo quantity >= 1
  image: { type: String }, // thêm field ảnh
>>>>>>> 7250971 (cartDone)
});

const cartSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
    cartId: { type: String, required: true, unique: true }, // Thay userId bằng cartId
=======
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
>>>>>>> 7250971 (cartDone)
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
