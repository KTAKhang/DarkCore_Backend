const express = require("express");

const routerReview = express.Router();

const reviewController = require("../controller/ReviewController");

const { attachUserFromHeader, authSaleStaffMiddleware, authCustomerMiddleware } = require("../middleware/authMiddleware");

routerReview.use(attachUserFromHeader);

routerReview.post("/create", attachUserFromHeader, authCustomerMiddleware, reviewController.createProductReview);

routerReview.put("/update/:id", attachUserFromHeader, authCustomerMiddleware, reviewController.updateReview);

routerReview.get("/user", attachUserFromHeader, authCustomerMiddleware, reviewController.getAllReviewsByUserId);

routerReview.get("/product/:product_id", attachUserFromHeader, reviewController.getProductReviews);

routerReview.get("/staff/viewlist", attachUserFromHeader, authSaleStaffMiddleware, reviewController.getAllReviewsForStaff);

routerReview.get("/detail/:id", attachUserFromHeader, authSaleStaffMiddleware, reviewController.getReviewDetail);

routerReview.put("/hidden/:id", attachUserFromHeader, authSaleStaffMiddleware, reviewController.updateReviewStatus);

routerReview.get(
    "/order-detail/:order_detail_id",
    authCustomerMiddleware,
    reviewController.getProductReviewByOrderDetailId
);

routerReview.get(
    "/order/:order_id",
    authCustomerMiddleware,
    reviewController.getProductReviewsByOrderId
);

module.exports = routerReview;
