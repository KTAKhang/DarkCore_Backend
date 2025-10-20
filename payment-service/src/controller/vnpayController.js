const crypto = require("crypto");
const Payment = require("../models/paymentModel");
const Order = require("../models/OrderModel");
const { createVnpayUrl } = require("../service/vnpayService"); 

// ================================
//  TẠO THANH TOÁN VNPAY
// ================================
const createPayment = async (req, res) => {
  try {
    const { orderId, amount, bankCode } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ 
        status: "ERR", 
        message: "Thiếu orderId hoặc amount" 
      });
    }

    //  Kiểm tra đơn hàng có tồn tại không
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        status: "ERR", 
        message: "Không tìm thấy đơn hàng" 
      });
    }

    // Tạo URL VNPay
    const paymentUrl = createVnpayUrl(orderId, amount, bankCode);
    console.log("🔧 Generated VNPay URL:", paymentUrl);

    // Lưu Payment vào DB
    const newPayment = new Payment({
      orderId,
      amount,
      method: "VNPAY",
      status: "pending",
    });
    await newPayment.save();

    console.log("✅ Created VNPay Payment:", orderId);
    res.status(200).json({ 
      status: "OK", 
      message: "Tạo URL thanh toán thành công",
      data: { paymentUrl } 
    });
  } catch (err) {
    console.error("❌ Error createPayment:", err);
    res.status(500).json({ 
      status: "ERR", 
      message: "Không thể tạo thanh toán VNPay" 
    });
  }
};

// ================================
// XỬ LÝ CALLBACK TỪ VNPAY
// ================================
const vnpayCallback = async (req, res) => {
  try {
    const vnp_ResponseCode = req.query.vnp_ResponseCode;
    const vnp_TxnRef = req.query.vnp_TxnRef; // orderId
    const vnp_SecureHash = req.query.vnp_SecureHash;

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
      return res.status(400).json({ error: "Sai chữ ký VNPay" });
    }

    // Xác định trạng thái thanh toán
    const status = vnp_ResponseCode === "00" ? "success" : "failed";

    // Cập nhật Payment
    await Payment.findOneAndUpdate({ orderId: vnp_TxnRef }, { status });

    // Cập nhật trạng thái đơn hàng
    const order = await Order.findById(vnp_TxnRef);
    if (order) {
      order.paymentStatus = status === "success" ? "paid" : "failed";
      await order.save();
      console.log(`✅ Order ${vnp_TxnRef} updated to ${order.paymentStatus}`);
    } else {
      console.warn("⚠️ Order not found:", vnp_TxnRef);
    }

    // Redirect về frontend với đầy đủ thông tin
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${baseUrl}/payment-result?vnp_ResponseCode=${vnp_ResponseCode}&vnp_TransactionStatus=${req.query.vnp_TransactionStatus}&vnp_TxnRef=${vnp_TxnRef}&vnp_Amount=${req.query.vnp_Amount}&vnp_OrderInfo=${req.query.vnp_OrderInfo}`;
    console.log('🔗 Redirecting to:', redirectUrl);
    console.log('🔗 VNPay params:', req.query);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Error in VNPay callback:", err);
    res.status(500).json({ error: "Xử lý callback thất bại" });
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
// 4️⃣ XEM DANH SÁCH GIAO DỊCH THẤT BẠI
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
