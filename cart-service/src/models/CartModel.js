const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
});

const CartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

// Virtual field tính số lượng sản phẩm khác nhau
CartSchema.virtual("sum").get(function () {
  return this.items.length;
});

// Đảm bảo khi JSON trả về có luôn field virtual
CartSchema.set("toJSON", { virtuals: true });
CartSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Cart", CartSchema);
