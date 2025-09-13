const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  rating: Number,
  comment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ReviewModel = mongoose.model("reviews", ReviewSchema);
module.exports = ReviewModel;
