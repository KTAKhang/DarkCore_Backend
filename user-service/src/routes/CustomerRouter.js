const express = require("express");
const routerCustomer = express.Router();
const customerController = require("../controller/CustomerController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
    authAdminMiddleware,
    attachUserFromHeader,
} = require("../middleware/authMiddleware");

routerCustomer.use(attachUserFromHeader);

routerCustomer.put("/:id/status", authAdminMiddleware, customerController.updateUserStatus);

routerCustomer.get("/get-all", authAdminMiddleware, customerController.getAllUser);

routerCustomer.get("/:id", authAdminMiddleware, customerController.getUserById);


module.exports = routerCustomer;