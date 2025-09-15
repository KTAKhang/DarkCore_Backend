const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      quantity: Number,
      priceAtAdd: Number,
    },
  ],
  totalPrice: Number,
  discountApplied: { type: mongoose.Schema.Types.ObjectId, ref: "discountcodes" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CartModel = mongoose.model("carts", CartSchema);
module.exports = CartModel;
