const mongoose = require("mongoose"); 

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
    },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["VNPAY"],
      default: "VNPAY",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    transactionNo: { type: String },
    payDate: { type: Date },

  
    vnp_TxnRef: { type: String, trim: true },
    vnp_ResponseCode: { type: String },
    vnp_TransactionStatus: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
