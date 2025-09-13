const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      quantity: Number,
      price: Number,
    },
  ],
  totalAmount: Number,
  status: { type: String, enum: ["pending", "confirmed", "shipped", "completed", "canceled"], default: "pending" },
  shippingAddress: String,
  paymentMethod: String,
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  trackingNumber: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const OrderModel = mongoose.model("orders", OrderSchema);
module.exports = OrderModel;
