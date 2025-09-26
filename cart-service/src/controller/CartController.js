const CartService = require("../services/CartService");


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
  }
};

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "User not found in token", status: "ERR" });
    }

    if (!productId || !quantity) {
      return res.status(400).json({ message: "productId and quantity are required" });
    }

    const cart = await CartService.addItem(userId, productId, quantity);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id || req.user.id;

    const cart = await CartService.updateItem(userId, itemId, quantity);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id || req.user.id;

    const cart = await CartService.removeItem(userId, itemId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cart = await CartService.clearCart(userId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
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
