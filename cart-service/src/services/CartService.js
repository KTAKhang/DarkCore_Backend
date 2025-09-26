const Cart = require("../models/CartModel");

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

    let cart = await Cart.findOne({ userId });

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

    const item = cart.items.id(itemId);
    if (!item) throw new Error("Item not found");

    item.quantity = quantity;
    await cart.save();
    return cart;
  }

  
  static async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();
    return cart;
  }

  
  static async clearCart(userId) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new Error("Cart not found");

    cart.items = [];
    await cart.save();
    return cart;
  }
}

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