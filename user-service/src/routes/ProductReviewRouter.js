const express = require("express");
const routerReview = express.Router();
const productReviewController = require("../controller/ProductReviewController");
const { attachUserFromHeader, authAdminMiddleware, authCustomerMiddleware, authUserMiddleware } = require("../middleware/authMiddleware");

routerReview.use(attachUserFromHeader);
routerReview.post("/create", authCustomerMiddleware, productReviewController.createReview);
routerReview.put("/update/:id", authCustomerMiddleware, productReviewController.updateReview);
routerReview.get("/user", authCustomerMiddleware, productReviewController.getProductReviewsByUserId);
routerReview.get("/product/:product_id", productReviewController.getProductReviews);
routerReview.get("/admin/viewlist", authAdminMiddleware, productReviewController.getAllReviewsForAdmin);
routerReview.get("/detail/:id", authAdminMiddleware, productReviewController.getReviewDetail);
routerReview.put("/hidden/:id", authAdminMiddleware, productReviewController.updateReviewStatus);

routerReview.get(
    "/order-detail/:order_detail_id",
    authCustomerMiddleware,
    productReviewController.getProductReviewByOrderDetailId
);


routerReview.get(
    "/order/:order_id",
    authUserMiddleware,
    productReviewController.getProductReviewsByOrderId
);


module.exports = routerReview;
