const crypto = require("crypto");
const Payment = require("../models/paymentModel");
const Order = require("../models/OrderModel");
const { createVnpayUrl } = require("../service/vnpayService"); 

// ================================
//  TẠO THANH TOÁN VNPAY
// ================================
const createPayment = async (req, res) => {
  try {
    const { txnRef, amount, bankCode, orderData } = req.body;

    // ✅ Validation: chỉ cần txnRef (temporary ID) và amount
    if (!txnRef || !amount) {
      return res.status(400).json({ 
        status: "ERR", 
        message: "Thiếu txnRef hoặc amount" 
      });
    }

    // ✅ XÓA PHẦN KIỂM TRA ORDER - vì order chưa tồn tại
    // Order sẽ được tạo SAU KHI thanh toán thành công trong callback
    
    console.log("🔧 Creating payment URL with txnRef:", txnRef);
    console.log("🔧 Order data to be saved after payment:", orderData);

    // Tạo URL VNPay với txnRef tạm thời
    const paymentUrl = createVnpayUrl(txnRef, amount, bankCode);
    console.log("🔧 Generated VNPay URL:", paymentUrl);

    // ✅ KHÔNG LƯU PAYMENT VÀO DB - vì chưa có order
    // Payment sẽ được tạo SAU KHI order được tạo trong callback

    console.log("✅ Created VNPay Payment URL for txnRef:", txnRef);
    res.status(200).json({ 
      status: "OK", 
      message: "Tạo URL thanh toán thành công",
      data: { 
        paymentUrl,
        txnRef 
      } 
    });
  } catch (err) {
    console.error("❌ Error createPayment:", err);
    res.status(500).json({ 
      status: "ERR", 
      message: "Không thể tạo thanh toán VNPay",
      error: err.message 
    });
  }
};

// ================================
// XỬ LÝ CALLBACK TỪ VNPAY
// ================================
const vnpayCallback = async (req, res) => {
  try {
    const vnp_ResponseCode = req.query.vnp_ResponseCode;
    const vnp_TxnRef = req.query.vnp_TxnRef; // txnRef tạm thời
    const vnp_SecureHash = req.query.vnp_SecureHash;
    const vnp_Amount = req.query.vnp_Amount;

    console.log("🔔 VNPay callback received for txnRef:", vnp_TxnRef);
    console.log("🔔 Response code:", vnp_ResponseCode);

    // Xác minh chữ ký VNPay
    const sortedParams = {};
    Object.keys(req.query)
      .sort()
      .forEach((key) => {
        if (key.startsWith("vnp_") && key !== "vnp_SecureHash") {
          sortedParams[key] = req.query[key];
        }
      });

    const signData = Object.entries(sortedParams)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    const secureHash = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(signData)
      .digest("hex");

    if (secureHash !== vnp_SecureHash) {
      console.warn("⚠️ Invalid VNPay signature");
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${baseUrl}/payment-result?status=error&message=Invalid signature`);
    }

    // Xác định trạng thái thanh toán
    const status = vnp_ResponseCode === "00" ? "success" : "failed";
    console.log("✅ Payment status:", status);

    // ✅ KHÔNG TẠO ORDER Ở ĐÂY - Frontend sẽ gọi API createOrderFromPayment sau khi verify
    // Chỉ redirect về frontend với thông tin thanh toán
    
    // Redirect về frontend với đầy đủ thông tin
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${baseUrl}/payment-result?vnp_ResponseCode=${vnp_ResponseCode}&vnp_TransactionStatus=${req.query.vnp_TransactionStatus}&vnp_TxnRef=${vnp_TxnRef}&vnp_Amount=${vnp_Amount}&vnp_OrderInfo=${encodeURIComponent(req.query.vnp_OrderInfo || '')}`;
    
    console.log('🔗 Redirecting to:', redirectUrl);
    console.log('🔗 VNPay params:', req.query);
    
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Error in VNPay callback:", err);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${baseUrl}/payment-result?status=error&message=Callback error`);
  }
};

// ================================
// HOÀN TIỀN (REFUND)
// ================================
const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Thiếu orderId" });

    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ error: "Không tìm thấy giao dịch" });

    payment.status = "refunded";
    await payment.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = "refunded";
      await order.save();
    }

    console.log(`💸 Refunded Payment for Order ${orderId}`);
    res.status(200).json({ message: "Hoàn tiền thành công" });
  } catch (err) {
    console.error("❌ Error refundPayment:", err);
    res.status(500).json({ error: "Hoàn tiền thất bại" });
  }
};

// ================================
//  XEM DANH SÁCH GIAO DỊCH THẤT BẠI
// ================================
const getFailedPayments = async (req, res) => {
  try {
    const failed = await Payment.find({ status: "failed" });
    res.status(200).json(failed);
  } catch (err) {
    console.error("❌ Error getFailedPayments:", err);
    res.status(500).json({ error: "Không thể lấy danh sách giao dịch thất bại" });
  }
};

module.exports = {
  createPayment,
  vnpayCallback,
  refundPayment,
  getFailedPayments,
};
