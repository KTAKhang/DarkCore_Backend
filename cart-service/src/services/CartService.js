const { Cart, CartItem } = require("../models/CartModel");
const Product = require("../models/Product");
const mongoose = require("mongoose"); 

// ======================
// Helpers
// Các hàm hỗ trợ để xử lý logic giỏ hàng
// ======================

// Tạo mới một giỏ hàng cho người dùng
const _createCart = async (userId) => {
  const newCart = new Cart({ userId }); // Tạo instance Cart mới với userId
  await newCart.save(); // Lưu giỏ hàng vào DB
  return newCart; // Trả về giỏ hàng vừa tạo
};

// Tính lại tổng giá trị của giỏ hàng dựa trên các item
const _recalculateTotal = async (cartId) => {
  const items = await CartItem.find({ cartId }); // Lấy tất cả CartItem theo cartId
  // Tính tổng giá trị bằng cách nhân giá và số lượng của từng item
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Cập nhật tổng giá trị vào giỏ hàng
  await Cart.findByIdAndUpdate(cartId, { total });
  return total; // Trả về tổng giá trị
};

// Lấy giỏ hàng đang hoạt động của người dùng, tạo mới nếu chưa có
const _getActiveCart = async (userId) => {
  // Tìm giỏ hàng với userId và trạng thái "active"
  let cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) {
    cart = await _createCart(userId); // Tạo mới nếu không tìm thấy
  }
  await cart.populate("items"); // Populate để lấy chi tiết các item trong giỏ
  return cart; // Trả về giỏ hàng
};

// ======================
// Cart Functions
// Các hàm xử lý logic giỏ hàng
// ======================

// Lấy thông tin giỏ hàng của người dùng
const getCart = async (userId) => {
  const cart = await _getActiveCart(userId); // Lấy giỏ hàng đang hoạt động
  await _recalculateTotal(cart._id); // Tính lại tổng giá trị để đảm bảo đồng bộ
  await cart.populate("items"); // Populate lại để đảm bảo dữ liệu đầy đủ
  return { status: "OK", cart }; // Trả về phản hồi với giỏ hàng
};

// Thêm sản phẩm vào giỏ hàng
const addItem = async (userId, productId, name, price, quantity, image) => {
  // Kiểm tra tính hợp lệ của productId và quantity
  if (
    !productId ||
    !quantity ||
    quantity < 1 ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new Error("Valid productId and quantity (>=1) are required"); // Ném lỗi nếu thông tin không hợp lệ
  }

  // Lấy thông tin sản phẩm từ DB
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found"); // Ném lỗi nếu sản phẩm không tồn tại

  const cart = await _getActiveCart(userId); // Lấy giỏ hàng đang hoạt động

  // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
  let existingItem = await CartItem.findOne({ cartId: cart._id, productId });

  if (existingItem) {
    // Nếu sản phẩm đã tồn tại, cập nhật số lượng
    const newQuantity = existingItem.quantity + quantity;
    // Kiểm tra số lượng mới có vượt quá tồn kho không
    if (newQuantity > product.stockQuantity) {
      throw new Error(
        `Quantity ${newQuantity} exceeds stock ${product.stockQuantity}`
      );
    }
    // Cập nhật số lượng của item
    existingItem = await CartItem.findByIdAndUpdate(
      existingItem._id,
      { quantity: newQuantity },
      { new: true }
    );
  } else {
    // Nếu sản phẩm chưa có, kiểm tra số lượng và tạo mới item
    if (quantity > product.stockQuantity) {
      throw new Error(
        `Quantity ${quantity} exceeds stock ${product.stockQuantity}`
      );
    }
    // Tạo instance CartItem mới với thông tin sản phẩm
    existingItem = new CartItem({
      cartId: cart._id,
      productId,
      name,
      price,
      quantity,
      image,
    });
    await existingItem.save(); // Lưu item vào DB
  }

  await _recalculateTotal(cart._id); // Tính lại tổng giá trị giỏ hàng

  const updatedCart = await _getActiveCart(userId); // Lấy lại giỏ hàng với populate
  return { status: "OK", message: "Item added", cart: updatedCart }; // Trả về phản hồi
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateItem = async (userId, productId, quantity) => {
  // Kiểm tra tính hợp lệ của productId và quantity
  if (
    !productId ||
    !quantity ||
    quantity < 1 ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new Error("Valid productId and quantity (>=1) are required"); // Ném lỗi nếu thông tin không hợp lệ
  }

  // Lấy thông tin sản phẩm từ DB
  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found"); // Ném lỗi nếu sản phẩm không tồn tại
  // Kiểm tra số lượng có vượt quá tồn kho không
  if (quantity > product.stockQuantity) {
    throw new Error(
      `Quantity ${quantity} exceeds stock ${product.stockQuantity}`
    );
  }

  const cart = await _getActiveCart(userId); // Lấy giỏ hàng đang hoạt động

  // Kiểm tra sản phẩm có trong giỏ hàng không
  const existingItem = await CartItem.findOne({ cartId: cart._id, productId });
  if (!existingItem) throw new Error("Item not found in cart"); // Ném lỗi nếu không tìm thấy item

  // Cập nhật số lượng của item
  await CartItem.findByIdAndUpdate(existingItem._id, { quantity });

  await _recalculateTotal(cart._id); // Tính lại tổng giá trị giỏ hàng

  const updatedCart = await _getActiveCart(userId); // Lấy lại giỏ hàng với populate
  return { status: "OK", message: "Item updated", cart: updatedCart }; // Trả về phản hồi
};

// Xóa sản phẩm khỏi giỏ hàng
const removeItem = async (userId, productId) => {
  // Kiểm tra tính hợp lệ của productId
  if (!productId || !mongoose.isValidObjectId(productId)) {
    throw new Error("Valid productId is required"); // Ném lỗi nếu productId không hợp lệ
  }

  const cart = await _getActiveCart(userId); // Lấy giỏ hàng đang hoạt động

  // Xóa item khỏi giỏ hàng
  const deletedItem = await CartItem.findOneAndDelete({
    cartId: cart._id,
    productId,
  });
  if (!deletedItem) throw new Error("Item not found in cart"); // Ném lỗi nếu không tìm thấy item

  await _recalculateTotal(cart._id); // Tính lại tổng giá trị giỏ hàng

  const updatedCart = await _getActiveCart(userId); // Lấy lại giỏ hàng với populate
  return { status: "OK", message: "Item removed", cart: updatedCart }; // Trả về phản hồi
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (userId) => {
  const cart = await _getActiveCart(userId); // Lấy giỏ hàng đang hoạt động

  // Xóa tất cả items trong giỏ hàng
  await CartItem.deleteMany({ cartId: cart._id });

  // Cập nhật tổng giá trị và trạng thái giỏ hàng
  await Cart.findByIdAndUpdate(cart._id, { total: 0, status: "checked_out" });

  // Lấy lại giỏ hàng với populate để xác nhận items rỗng
  const updatedCart = await Cart.findById(cart._id).populate("items");
  return { status: "OK", message: "Cart cleared", cart: updatedCart }; // Trả về phản hồi
};

// ======================
// Export theo CommonJS
// Xuất các hàm xử lý giỏ hàng để sử dụng ở nơi khác
// ======================
module.exports = {
  getCart, // Xuất hàm lấy giỏ hàng
  addItem, // Xuất hàm thêm sản phẩm
  updateItem, // Xuất hàm cập nhật sản phẩm
  removeItem, // Xuất hàm xóa sản phẩm
  clearCart, // Xuất hàm xóa toàn bộ giỏ hàng
};