const express = require("express");
const { createPayment, vnpayCallback, refundPayment, getFailedPayments } = require("../controller/vnpayController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Routes Tạo thanh toán + gọi về

router.post("/vnpay/create", authMiddleware, createPayment);
router.get("/vnpay/callback", vnpayCallback);


// Routes Hoàn tiền + thất bại 

router.post("/vnpay/refund", authMiddleware, refundPayment);
router.get("/vnpay/failed", authMiddleware, getFailedPayments);

module.exports = router;
