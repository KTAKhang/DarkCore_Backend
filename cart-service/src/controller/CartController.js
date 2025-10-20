const mongoose = require("mongoose"); 
const CartService = require("../services/CartService"); 
const Product = require("../models/Product"); 
const User = require("../models/UserModel"); 

// ======================
// Helper validate userId
// Kiểm tra tính hợp lệ của userId và xác thực người dùng tồn tại
// ======================
const _validateUser = async (userId) => {
  // Kiểm tra userId có phải là ObjectId hợp lệ
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid userId"); // Ném lỗi nếu userId không hợp lệ
  }
  // Tìm người dùng trong DB dựa trên userId
  const user = await User.findById(userId);
  // Kiểm tra người dùng có tồn tại hay không
  if (!user) {
    throw new Error("User not found"); // Ném lỗi nếu không tìm thấy người dùng
  }
  return user; // Trả về thông tin người dùng
};

// ======================
// Helper validate productId & quantity
// Kiểm tra tính hợp lệ của productId và quantity
// ======================
const _validateProductInput = (productId, quantity) => {
  // Kiểm tra productId và quantity có tồn tại, quantity >= 1 và productId là ObjectId hợp lệ
  if (
    !productId ||
    !quantity ||
    quantity < 1 ||
    !mongoose.isValidObjectId(productId)
  ) {
    throw new Error("Valid productId and quantity (>=1) are required"); // Ném lỗi nếu thông tin không hợp lệ
  }
};

// ======================
// Helper get product & validate stock
// Lấy thông tin sản phẩm và kiểm tra số lượng tồn kho
// ======================
const _getProduct = async (productId, quantity) => {
  // Tìm sản phẩm trong DB dựa trên productId
  const product = await Product.findById(productId);
  // Kiểm tra sản phẩm có tồn tại và có đầy đủ thông tin (name, price, stockQuantity)
  if (!product || !product.name || !product.price || !product.stockQuantity) {
    throw new Error("Product not found or invalid"); // Ném lỗi nếu sản phẩm không hợp lệ
  }
  // Kiểm tra số lượng yêu cầu có vượt quá số lượng tồn kho
  if (quantity > product.stockQuantity) {
    throw new Error(`Sản phẩm chỉ còn ${product.stockQuantity} trong kho`); // Ném lỗi nếu vượt quá tồn kho
  }
  return product; // Trả về thông tin sản phẩm
};

// ======================
// Controller functions
// Các hàm xử lý yêu cầu API cho giỏ hàng
// ======================

// Lấy thông tin giỏ hàng của người dùng
const getCart = async (req, res) => {
  try {
    // Xác thực người dùng bằng userId từ req.user
    await _validateUser(req.user._id);

    // Gọi CartService để lấy giỏ hàng
    const result = await CartService.getCart(req.user._id);
    // Trả về phản hồi với mã trạng thái 200 nếu thành công, 404 nếu không tìm thấy
    res.status(result.status === "OK" ? 200 : 404).json(result);
  } catch (err) {
    // Xử lý lỗi và trả về phản hồi với mã trạng thái 400
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

// Thêm sản phẩm vào giỏ hàng
const addItem = async (req, res) => {
  try {
    // Xác thực người dùng
    await _validateUser(req.user._id);

    // Lấy productId và quantity từ body của request
    const { productId, quantity } = req.body;

    // Kiểm tra tính hợp lệ của productId và quantity
    _validateProductInput(productId, quantity);
    // Lấy thông tin sản phẩm và kiểm tra tồn kho
    const product = await _getProduct(productId, quantity);

    // Gọi CartService để thêm sản phẩm vào giỏ hàng
    const result = await CartService.addItem(
      req.user._id, // ID người dùng
      productId, // ID sản phẩm
      product.name, // Tên sản phẩm
      product.price, // Giá sản phẩm
      quantity, // Số lượng
      product.images?.[0] || null // Hình ảnh đầu tiên của sản phẩm (nếu có)
    );

    // Trả về phản hồi với mã trạng thái 201 nếu thành công, 400 nếu thất bại
    res.status(result.status === "OK" ? 201 : 400).json(result);
  } catch (err) {
    // Xử lý lỗi và trả về phản hồi với mã trạng thái 400
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateItem = async (req, res) => {
  try {
    // Xác thực người dùng
    await _validateUser(req.user._id);

    // Lấy productId từ params và quantity từ body
    const { productId } = req.params;
    const { quantity } = req.body;

    // Kiểm tra tính hợp lệ của productId và quantity
    _validateProductInput(productId, quantity);
    // Kiểm tra thông tin sản phẩm và tồn kho
    await _getProduct(productId, quantity);

    // Gọi CartService để cập nhật số lượng sản phẩm
    const result = await CartService.updateItem(
      req.user._id, // ID người dùng
      productId, // ID sản phẩm
      quantity // Số lượng mới
    );
    // Trả về phản hồi với mã trạng thái 200 nếu thành công, 400 nếu thất bại
    res.status(result.status === "OK" ? 200 : 400).json(result);
  } catch (err) {
    // Xử lý lỗi và trả về phản hồi với mã trạng thái 400
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeItem = async (req, res) => {
  try {
    // Xác thực người dùng
    await _validateUser(req.user._id);

    // Lấy productId từ params
    const { productId } = req.params;

    // Kiểm tra productId có hợp lệ
    if (!productId || !mongoose.isValidObjectId(productId)) {
      throw new Error("Valid productId is required"); // Ném lỗi nếu productId không hợp lệ
    }

    // Gọi CartService để xóa sản phẩm khỏi giỏ hàng
    const result = await CartService.removeItem(req.user._id, productId);
    // Trả về phản hồi với mã trạng thái 200 nếu thành công, 400 nếu thất bại
    res.status(result.status === "OK" ? 200 : 400).json(result);
  } catch (err) {
    // Xử lý lỗi và trả về phản hồi với mã trạng thái 400
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    // Xác thực người dùng
    await _validateUser(req.user._id);

    // Gọi CartService để xóa toàn bộ giỏ hàng
    const result = await CartService.clearCart(req.user._id);
    // Trả về phản hồi với mã trạng thái 200 nếu thành công, 400 nếu thất bại
    res.status(result.status === "OK" ? 200 : 400).json(result);
  } catch (err) {
    // Xử lý lỗi và trả về phản hồi với mã trạng thái 400
    res.status(400).json({ status: "ERR", message: err.message });
  }
};

// ======================
// Export CommonJS
// Xuất các hàm controller để sử dụng trong router
// ======================
module.exports = {
  getCart, // Xuất hàm lấy giỏ hàng
  addItem, // Xuất hàm thêm sản phẩm
  updateItem, // Xuất hàm cập nhật sản phẩm
  removeItem, // Xuất hàm xóa sản phẩm
  clearCart, // Xuất hàm xóa toàn bộ giỏ hàng
};