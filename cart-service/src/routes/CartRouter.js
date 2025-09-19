const express = require("express");
const router = express.Router();
const CartController = require("../controller/CartController");
const { verifyToken } = require("../middleware/authCart"); 

router.get("/", verifyToken, CartController.getCart);
router.post("/items", verifyToken, CartController.addItem);
router.put("/items/:itemId", verifyToken, CartController.updateItem);
router.delete("/items/:itemId", verifyToken, CartController.removeItem);
router.delete("/", verifyToken, CartController.clearCart);

module.exports = router;
