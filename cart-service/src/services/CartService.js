const Cart = require("../models/CartModel");

class CartService {
  // Lấy giỏ hàng theo user
  static async getCart(userId) {
    let cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    return cart;
  }

  // Thêm sản phẩm vào giỏ
  static async addItem(userId, productId, quantity) {
    if (!productId || !quantity) {
      throw new Error("Missing productId or quantity");
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      // Nếu có rồi thì tăng số lượng
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Nếu chưa có thì thêm mới
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    return cart;
  }

  // Cập nhật số lượng
  static async updateItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");

    const item = cart.items.id(itemId);
    if (!item) throw new Error("Item not found");

    item.quantity = quantity;
    await cart.save();
    return cart;
  }

  // Xóa item
  static async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();
    return cart;
  }

  // Xóa toàn bộ giỏ
  static async clearCart(userId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");

    cart.items = [];
    await cart.save();
    return cart;
  }
}

module.exports = CartService;
