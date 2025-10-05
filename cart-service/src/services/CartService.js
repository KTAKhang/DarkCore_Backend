const Cart = require("../models/CartModel");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// ======================
// Helpers
// ======================
const _createCart = async (userId) => {
  const cart = new Cart({ userId, items: [], total: 0, status: "active" });
  await cart.save();
  return cart;
};

const _calculateTotal = (cart) => {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// ======================
// Cart Functions
// ======================
const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) cart = await _createCart(userId);

  return { status: "OK", cart };
};

const addItem = async (userId, productId, name, price, quantity, image) => {
  if (
    !productId ||
    !quantity ||
    quantity < 1 ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new Error("Valid productId and quantity (>=1) are required");
  }

  // Lấy product từ DB để check stock
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  let cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) cart = await _createCart(userId);

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    const newQuantity = cart.items[itemIndex].quantity + quantity;
    if (newQuantity > product.stockQuantity) {
      throw new Error(
        `Quantity ${newQuantity} exceeds stock ${product.stockQuantity}`
      );
    }
    cart.items[itemIndex].quantity = newQuantity;
  } else {
    if (quantity > product.stockQuantity) {
      throw new Error(
        `Quantity ${quantity} exceeds stock ${product.stockQuantity}`
      );
    }
    cart.items.push({ productId, name, price, quantity, image });
  }

  cart.total = _calculateTotal(cart);
  await cart.save();

  return { status: "OK", message: "Item added", cart };
};

const updateItem = async (userId, productId, quantity) => {
  if (
    !productId ||
    !quantity ||
    quantity < 1 ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new Error("Valid productId and quantity (>=1) are required");
  }

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");
  if (quantity > product.stockQuantity) {
    throw new Error(
      `Quantity ${quantity} exceeds stock ${product.stockQuantity}`
    );
  }

  const cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) throw new Error("Cart not found or not active");

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );
  if (itemIndex === -1) throw new Error("Item not found in cart");

  cart.items[itemIndex].quantity = quantity;
  cart.total = _calculateTotal(cart);
  await cart.save();

  return { status: "OK", message: "Item updated", cart };
};

const removeItem = async (userId, productId) => {
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw new Error("Valid productId is required");
  }

  const cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) throw new Error("Cart not found or not active");

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );
  cart.total = _calculateTotal(cart);
  await cart.save();

  return { status: "OK", message: "Item removed", cart };
};

const clearCart = async (userId) => {
  let cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) cart = await _createCart(userId);
  else {
    cart.items = [];
    cart.total = 0;
    cart.status = "checked_out";
  }

  await cart.save();
  return { status: "OK", message: "Cart cleared", cart };
};

// ======================
// Export theo CommonJS
// ======================
module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
