const { Cart, CartItem } = require("../models/CartModel");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// ======================
// Helpers
// ======================
const _createCart = async (userId) => {
  const newCart = new Cart({ userId });
  await newCart.save();
  return newCart;
};

const _recalculateTotal = async (cartId) => {
  const items = await CartItem.find({ cartId });
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  await Cart.findByIdAndUpdate(cartId, { total });
  return total;
};

const _getActiveCart = async (userId) => {
  let cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) {
    cart = await _createCart(userId);
  }
  await cart.populate("items"); // Populate items để có chi tiết
  return cart;
};

// ======================
// Cart Functions
// ======================
const getCart = async (userId) => {
  const cart = await _getActiveCart(userId);
  await _recalculateTotal(cart._id); // Đảm bảo total sync
  await cart.populate("items"); // Populate lại nếu cần
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

  const cart = await _getActiveCart(userId);

  // Kiểm tra item tồn tại
  let existingItem = await CartItem.findOne({ cartId: cart._id, productId });

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stockQuantity) {
      throw new Error(
        `Quantity ${newQuantity} exceeds stock ${product.stockQuantity}`
      );
    }
    existingItem = await CartItem.findByIdAndUpdate(
      existingItem._id,
      { quantity: newQuantity },
      { new: true }
    );
  } else {
    if (quantity > product.stockQuantity) {
      throw new Error(
        `Quantity ${quantity} exceeds stock ${product.stockQuantity}`
      );
    }
    existingItem = new CartItem({
      cartId: cart._id,
      productId,
      name,
      price,
      quantity,
      image,
    });
    await existingItem.save();
  }

  await _recalculateTotal(cart._id);

  const updatedCart = await _getActiveCart(userId); // Lấy lại với populate
  return { status: "OK", message: "Item added", cart: updatedCart };
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

  const cart = await _getActiveCart(userId);

  const existingItem = await CartItem.findOne({ cartId: cart._id, productId });
  if (!existingItem) throw new Error("Item not found in cart");

  await CartItem.findByIdAndUpdate(existingItem._id, { quantity });

  await _recalculateTotal(cart._id);

  const updatedCart = await _getActiveCart(userId);
  return { status: "OK", message: "Item updated", cart: updatedCart };
};

const removeItem = async (userId, productId) => {
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw new Error("Valid productId is required");
  }

  const cart = await _getActiveCart(userId);

  const deletedItem = await CartItem.findOneAndDelete({
    cartId: cart._id,
    productId,
  });
  if (!deletedItem) throw new Error("Item not found in cart");

  await _recalculateTotal(cart._id);

  const updatedCart = await _getActiveCart(userId);
  return { status: "OK", message: "Item removed", cart: updatedCart };
};

const clearCart = async (userId) => {
  const cart = await _getActiveCart(userId);

  // Xóa tất cả items
  await CartItem.deleteMany({ cartId: cart._id });

  // Update total và status
  await Cart.findByIdAndUpdate(cart._id, { total: 0, status: "checked_out" });

  const updatedCart = await Cart.findById(cart._id).populate("items"); // Populate để thấy items rỗng
  return { status: "OK", message: "Cart cleared", cart: updatedCart };
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
