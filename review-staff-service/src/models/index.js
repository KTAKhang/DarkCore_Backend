const mongoose = require("mongoose");

// Import all models
const RoleModel = require("./RolesModel");
const UserModel = require("./UserModel");
const ProductModel = require("./ProductModel");
const ProductReviewModel = require("./ProductReviewsModel");
const OrderModel = require("./OrderModel");
const OrderDetailModel = require("./OrderDetailModel");
const OrderStatusModel = require("./OrderStatusModel");

// Export all models
module.exports = {
    RoleModel,
    UserModel,
    ProductModel,
    ProductReviewModel,
    OrderModel,
    OrderDetailModel,
    OrderStatusModel,
};

