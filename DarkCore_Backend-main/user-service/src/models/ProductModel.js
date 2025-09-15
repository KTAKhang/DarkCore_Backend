const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stockQuantity: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  images: [String],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "reviews" }],
  ratingsAverage: Number,
  brand: String,
  warrantyDetails: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ProductModel = mongoose.model("products", ProductSchema);
module.exports = ProductModel;
