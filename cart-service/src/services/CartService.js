const Cart = require("../models/CartModel");
const mongoose = require("mongoose");

<<<<<<< HEAD
class CartService {
 
  static async getCart(userId) {
    let cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    return cart;
  }

 
  static async addItem(userId, productId, quantity) {
    if (!productId || !quantity) {
      throw new Error("Missing productId or quantity");
    }
=======
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

  let cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) cart = await _createCart(userId);
>>>>>>> 7250971 (cartDone)

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );

<<<<<<< HEAD
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }


    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
     
      cart.items[itemIndex].quantity += quantity;
    } else {
    
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    return cart;
  }

 
  static async updateItem(userId, itemId, quantity) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");
=======
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ productId, name, price, quantity, image });
  }

  cart.total = _calculateTotal(cart);
  await cart.save();
>>>>>>> 7250971 (cartDone)

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

<<<<<<< HEAD
  
  static async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");
=======
  const cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) throw new Error("Cart not found or not active");
>>>>>>> 7250971 (cartDone)

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

<<<<<<< HEAD
  
  static async clearCart(userId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");
=======
  const cart = await Cart.findOne({ userId, status: "active" });
  if (!cart) throw new Error("Cart not found or not active");
>>>>>>> 7250971 (cartDone)

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

<<<<<<< HEAD
module.exports = CartService;
// const Cart = require("../models/CartModel");

// class CartService {

//   static async getCart(cartId) {
//     let cart = await Cart.findOne({ cartId }).populate("items.productId");
//     if (!cart) {
//       cart = new Cart({ cartId, items: [] });
//       await cart.save();
//     }
//     return cart;
//   }


//   static async addItem(cartId, productId, quantity) {
//     if (!productId || !quantity) {
//       throw new Error("Missing productId or quantity");
//     }

//     let cart = await Cart.findOne({ cartId });

//     if (!cart) {
//       cart = new Cart({ cartId, items: [] });
//     }

//     const itemIndex = cart.items.findIndex(
//       (item) => item.productId.toString() === productId
//     );

//     if (itemIndex > -1) {
    
//       cart.items[itemIndex].quantity += quantity;
//     } else {
      
//       cart.items.push({ productId, quantity });
//     }

//     await cart.save();
//     return cart;
//   }


//   static async updateItem(cartId, itemId, quantity) {
//     const cart = await Cart.findOne({ cartId });
//     if (!cart) throw new Error("Cart not found");

//     const item = cart.items.id(itemId);
//     if (!item) throw new Error("Item not found");

//     item.quantity = quantity;
//     await cart.save();
//     return cart;
//   }

 
//   static async removeItem(cartId, itemId) {
//     const cart = await Cart.findOne({ cartId });
//     if (!cart) throw new Error("Cart not found");

//     cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
//     await cart.save();
//     return cart;
//   }


//   static async clearCart(cartId) {
//     const cart = await Cart.findOne({ cartId });
//     if (!cart) {
     
//       return { cartId, items: [] };
//     }

//     cart.items = [];
//     await cart.save();
//     return cart;
//   }
// }

// module.exports = CartService;
=======
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
>>>>>>> 7250971 (cartDone)
