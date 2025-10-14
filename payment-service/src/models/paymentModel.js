const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["VNPAY"], default: "VNPAY" },
    status: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending" }, 
    transactionNo: { type: String },
    bankCode: { type: String },
    payDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);