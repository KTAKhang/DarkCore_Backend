const mongoose = require("mongoose");
const CartService = require("../services/CartService");
const Product = require("../models/Product");

<<<<<<< HEAD

exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload", status: "ERR" });
    }

    const cart = await CartService.getCart(userId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
=======
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
>>>>>>> 7250971 (cartDone)
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
<<<<<<< HEAD
// const CartService = require("../services/CartService");

// exports.getCart = async (req, res) => {
//   try {
    
//     const cartId = req.body.cartId || req.cookies.cartId;
//     if (!cartId) {
//       return res.status(400).json({ message: "cartId is required", status: "ERR" });
//     }

//     const cart = await CartService.getCart(cartId);
//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.addItem = async (req, res) => {
//   try {
//     const { productId, quantity, cartId } = req.body;

//     if (!cartId) {
//       return res.status(400).json({ message: "cartId is required", status: "ERR" });
//     }
//     if (!productId || !quantity) {
//       return res.status(400).json({ message: "productId and quantity are required", status: "ERR" });
//     }

//     const cart = await CartService.addItem(cartId, productId, quantity);
   
//     res.cookie("cartId", cartId, { httpOnly: true });
//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.updateItem = async (req, res) => {
//   try {
//     const { itemId } = req.params;
//     const { quantity, cartId } = req.body;

//     if (!cartId) {
//       return res.status(400).json({ message: "cartId is required", status: "ERR" });
//     }

//     const cart = await CartService.updateItem(cartId, itemId, quantity);
//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.removeItem = async (req, res) => {
//   try {
//     const { itemId } = req.params;
//     const cartId = req.body.cartId || req.cookies.cartId;

//     if (!cartId) {
//       return res.status(400).json({ message: "cartId is required", status: "ERR" });
//     }

//     const cart = await CartService.removeItem(cartId, itemId);
//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.clearCart = async (req, res) => {
//   try {
//     const cartId = req.body.cartId || req.cookies.cartId;

//     if (!cartId) {
//       return res.status(400).json({ message: "cartId is required", status: "ERR" });
//     }

//     const cart = await CartService.clearCart(cartId);
//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
=======

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
>>>>>>> 7250971 (cartDone)
