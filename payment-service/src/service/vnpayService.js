const qs = require("qs");
const crypto = require("crypto");
const { vnpConfig } = require("../config/vnpayConfig");

const pad = (n) => n.toString().padStart(2, "0");

const createVnpayUrl = (orderId, amount, ipAddr = "127.0.0.1") => {
  try {
    console.log("🔧 VNPay Config:", vnpConfig);
    console.log("🔧 Creating URL for orderId:", orderId, "amount:", amount);
    
    const dt = new Date();
    const yyyyMMddHHmmss = `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;

    // Normalize localhost/IPv6 to IPv4 localhost for compatibility
    const normalizedIp = (ipAddr || "127.0.0.1").includes("::") ? "127.0.0.1" : ipAddr;

  // Base params (do not include hash fields here)
  const baseParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnpConfig.tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: `Thanh toán cho đơn hàng ${orderId}`,
    vnp_OrderType: "billpayment",
    vnp_Amount: amount * 100, //  nhân 100 lần duy nhất ở đây
    vnp_ReturnUrl: vnpConfig.returnUrl,
    vnp_IpAddr: normalizedIp,
    vnp_CreateDate: yyyyMMddHHmmss,
  };

  // VNPAY khuyến nghị encode từng value và thay space thành '+' trước khi ký
  const encodeParams = (obj) => {
    const encoded = {};
    Object.keys(obj).forEach((k) => {
      const value = obj[k];
      encoded[k] = encodeURIComponent(value).replace(/%20/g, "+");
    });
    return encoded;
  };

  // Params dùng để ký: KHÔNG gồm vnp_SecureHash và vnp_SecureHashType
  const paramsForSign = encodeParams(baseParams);

  // 🔹 Sắp xếp key tăng dần để tạo chuỗi ký
  const sortedForSign = {};
  Object.keys(paramsForSign)
    .sort()
    .forEach((k) => (sortedForSign[k] = paramsForSign[k]));

  // 🔹 Tạo chữ ký HmacSHA512
  const signData = qs.stringify(sortedForSign, { encode: false });
  const signed = crypto
    .createHmac("sha512", vnpConfig.hashSecret)
    .update(signData, "utf-8")
    .digest("hex");

  // Params gửi đi: gồm tất cả base params (đã encode), thêm vnp_SecureHashType và vnp_SecureHash
  const finalParams = {
    ...paramsForSign,
    vnp_SecureHashType: "HmacSHA512", // gửi kèm type theo khuyến nghị của VNPAY
    vnp_SecureHash: signed,
  };

  // Debug log
  console.log("✅ signData:", signData);
  console.log("✅ vnp_SecureHash:", signed);

    // Vì đã encode từng value ở trên nên không encode lần nữa khi stringify
    return `${vnpConfig.vnpUrl}?${qs.stringify(finalParams, { encode: false })}`;
  } catch (error) {
    console.error("❌ Error creating VNPay URL:", error);
    throw error;
  }
};

module.exports = { createVnpayUrl };