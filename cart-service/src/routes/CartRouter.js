const express = require("express");
const router = express.Router();
const CartController = require("../controller/CartController");
// const { verifyToken } = require("../middleware/authCart");

router.get("/", CartController.getCart);
router.post("/items", CartController.addItem);
router.put("/items/:itemId", CartController.updateItem);
router.delete("/items/:itemId", CartController.removeItem);
router.delete("/", CartController.clearCart);

module.exports = router;
