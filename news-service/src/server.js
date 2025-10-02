require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Import router cho Cart
// const cartRouter = require("./routes/CartRouter");

// Middleware
// app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB (News Service)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
// app.use("/", cartRouter);

// Server listen
const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`🛒 Cart Service running on port ${PORT}`);
});
