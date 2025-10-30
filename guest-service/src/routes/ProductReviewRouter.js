const express = require("express");
const routerReview = express.Router();
const productReviewController = require("../controller/ProductReviewController");

routerReview.get("/product/:product_id", productReviewController.getProductReviews);

module.exports = routerReview;
