const express = require("express");
const router = express.Router();

const {
    createPayment,
    vnpayCallback,
    refundPayment,
    getFailedPayments
} = require("../controller/vnpayController");

const { authMiddleware } = require("../middleware/authMiddleware");

// Tạo thanh toán
router.post("/vnpay/create", authMiddleware, createPayment);

// Callback từ VNPAY (không cần nữa vì redirect trực tiếp về frontend)
// router.get("/vnpay/callback", vnpayCallback);

// Hoàn tiền
router.post("/vnpay/refund", authMiddleware, refundPayment);

// Danh sách thất bại
router.get("/vnpay/failed", authMiddleware, getFailedPayments);

module.exports = router;
