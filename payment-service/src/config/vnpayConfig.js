require("dotenv").config();

const vnpConfig = {
  tmnCode: process.env.VNPAY_TMN_CODE.trim(),
  hashSecret: process.env.VNPAY_HASH_SECRET.trim(),
  vnpUrl: process.env.VNPAY_URL.trim(),
  returnUrl: process.env.VNPAY_RETURN_URL.trim(),
};

module.exports = { vnpConfig };
