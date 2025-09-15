const mongoose = require("mongoose");

const DiscountCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  discountType: { type: String, enum: ["percentage", "fixed"] },
  value: Number,
  expirationDate: Date,
  usageLimit: Number,
  usedCount: Number,
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "products" }],
  applicableUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DiscountCodeModel = mongoose.model("discountcodes", DiscountCodeSchema);
module.exports = DiscountCodeModel;
