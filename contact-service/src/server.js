  require("dotenv").config();
  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");

  const app = express();

  // ==============================
  // 🔹 MIDDLEWARES
  // ==============================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // ==============================
  // 🔹 REGISTER MODELS
  // ==============================
  require("./model/UserModel");
  require("./model/ContactModel");
  require("./model/ContactReplyModel");

  // ==============================
  // 🔹 ROUTES
  // ==============================
  const contactRouter = require("./routes/ContactRouter");
  app.use("/contacts", contactRouter); // ⚠️ Nên thêm prefix rõ ràng

  // ==============================
  // 🔹 DATABASE CONNECTION
  // ==============================
  const connectDB = async () => {
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) {
      console.error("❌ BUG: MONGO_URL is undefined! Check your .env file.");
      process.exit(1);
    }

    try {
      await mongoose.connect(mongoURL);
      console.log("✅ MongoDB connected successfully!");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message);
      process.exit(1);
    }
  };

  connectDB();

  // ==============================
  // 🔹 ROOT ROUTE & ERROR HANDLER
  // ==============================
  app.get("/", (req, res) => {
    res.send("📬 Contact Service is running!");
  });

  // Global error handler (cho dễ debug)
  app.use((err, req, res, next) => {
    console.error("💥 Server Error:", err);
    res.status(500).json({ message: err.message || "Internal Server Error" });
  });

  // ==============================
  // 🔹 SERVER LISTEN
  // ==============================
  const PORT = process.env.PORT || 3009;
  app.listen(PORT, () => {
    console.log(`🚀 Contact Service running on port ${PORT}`);
  });
