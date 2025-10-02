const mongoose = require("mongoose");
const CartService = require("../services/CartService");
const Product = require("../models/Product");

// ======================
// Helper validate productId & quantity
// ======================
const _validateProductInput = (productId, quantity) => {
  if (
    !productId ||
    !quantity ||
    quantity < 1 ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new Error("Valid productId and quantity (>=1) are required");
  }
};

// ======================
// Helper get product & validate stock
// ======================
const _getProduct = async (productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product || !product.name || !product.price || !product.stockQuantity) {
    throw new Error("Product not found or invalid");
  }
  if (quantity > product.stockQuantity) {
    throw new Error(
      `Quantity ${quantity} exceeds stock ${product.stockQuantity}`
    );
  }
  return product;
};

// ======================
// Controller functions
// ======================
const getCart = async (req, res) => {
  try {
    const result = await CartService.getCart(req.user._id);
    res.status(result.status === "OK" ? 200 : 404).json(result);
  } catch (err) {
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    _validateProductInput(productId, quantity);
    const product = await _getProduct(productId, quantity);

    const result = await CartService.addItem(
      req.user._id,
      productId,
      product.name,
      product.price,
      quantity,
      product.images?.[0] || null // 👉 truyền thêm ảnh
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    _validateProductInput(productId, quantity);
    await _getProduct(productId, quantity);

    const result = await CartService.updateItem(
      req.user._id,
      productId,
      quantity
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      throw new Error("Valid productId is required");
    }

    const result = await CartService.removeItem(req.user._id, productId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const result = await CartService.clearCart(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

// ======================
// Export CommonJS
// ======================
module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
