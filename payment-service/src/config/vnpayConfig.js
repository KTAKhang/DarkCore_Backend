require("dotenv").config();

const vnpConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE?.trim() || '7AF0W1IK',
  hashSecret: process.env.VNPAY_HASH_SECRET?.trim() || '4FPENGYH66SJ6AKVA90JRZ6TT0LVBPXR',
  vnpUrl: process.env.VNPAY_URL?.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNPAY_RETURN_URL?.trim() || 'http://localhost:5173/payment-result',
};

module.exports = { vnpConfig };
