const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes =  require("./routes/OrderRouter");
const paymentOrderRoutes = require("./routes/PaymentOrderRoutes");
const { initOrderStatuses } = require("./utils/initOrderStatus");

dotenv.config();

const app = express();

// Middleware để log tất cả requests đến payment service
app.use((req, res, next) => {
  console.log('🔍 Payment Service - Request:', req.method, req.url);
  console.log('🔍 Payment Service - Auth header:', req.headers.authorization ? 'Has token' : 'No token');
  next();
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/payment", paymentRoutes);
app.use("/api", orderRoutes);
app.use("/api/payment", paymentOrderRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("MongoDB connected");
    // Khởi tạo dữ liệu mẫu
    await initOrderStatuses();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
