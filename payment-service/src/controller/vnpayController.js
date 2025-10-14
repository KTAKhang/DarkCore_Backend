const { createVnpayUrl } = require("../service/vnpayService");
const Payment = require("../models/paymentModel");
const axios = require("axios");

const createPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const parsedAmount = parseInt(amount);

    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    console.log("🟢 Creating payment:", { orderId, parsedAmount });

    const payment = await Payment.create({
      orderId,
      amount: parsedAmount,
      method: "VNPAY",
      status: "pending",
    });

    const paymentUrl = createVnpayUrl(orderId, parsedAmount, ipAddr);

    return res.status(200).json({ paymentUrl, payment });
  } catch (err) {
    console.error("❌ Error creating payment:", err);
    return res.status(500).json({ error: "Failed to create payment" });
  }
};

//  Xử lý callback từ VNPAY
const vnpayCallback = async (req, res) => {
  try {
    const vnp_ResponseCode = req.query.vnp_ResponseCode;
    const vnp_TxnRef = req.query.vnp_TxnRef;

    console.log("🔁 VNPAY Callback:", req.query);

    const status = vnp_ResponseCode === "00" ? "success" : "failed";



    await Payment.findOneAndUpdate({ orderId: vnp_TxnRef }, { status });

    await axios.put(`${process.env.ORDER_SERVICE_URL}/orders/${vnp_TxnRef}/status`, { status });

    //  Redirect về frontend (VD: React)
    const redirectUrl = `http://localhost:5173/payment/result?status=${status}&orderId=${vnp_TxnRef}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Error in callback:", err);
    res.status(500).json({ error: "Callback failed" });
  }
};

//  Hoàn tiền (Refund)
const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status !== "success") {
      return res.status(400).json({ message: "Only successful payments can be refunded" });
    }

    payment.status = "refunded";
    await payment.save();

    await axios.put(`${process.env.ORDER_SERVICE_URL}/orders/${orderId}/status`, { status: "refunded" });

    res.json({ message: "Payment refunded successfully", payment });
  } catch (err) {
    console.error("Refund error:", err);
    res.status(500).json({ error: "Refund failed" });
  }
};

// ✅ Lấy danh sách giao dịch thất bại
const getFailedPayments = async (req, res) => {
  try {
    const failedPayments = await Payment.find({ status: "failed" });
    res.json(failedPayments);
  } catch (err) {
    console.error("Failed payments fetch error:", err);
    res.status(500).json({ error: "Could not fetch failed payments" });
  }
};
// Lấy danh sách giao dịch thành công 
const getSuccessfulPayments = async (req, res) => {
  try {
    const successPayments = await Payment.find({ status: "success" }).sort({ createdAt: -1 });
    res.json(successPayments);
  } catch (err) {
    console.error("Get success payments error:", err);
    res.status(500).json({ error: "Could not fetch success payments" });
  }
};



module.exports = {
  createPayment,
  vnpayCallback,
  refundPayment,
  getFailedPayments,
  getSuccessfulPayments,
};
