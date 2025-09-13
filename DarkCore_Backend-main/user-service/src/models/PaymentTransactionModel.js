const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "orders" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  amount: Number,
  gateway: { type: String, enum: ["PayPal", "Stripe", "Momo", "ZaloPay"] },
  transactionId: String,
  status: { type: String, enum: ["success", "failed", "refunded", "pending"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PaymentTransactionModel = mongoose.model("paymenttransactions", PaymentTransactionSchema);
module.exports = PaymentTransactionModel;
