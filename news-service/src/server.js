require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const app = express();

// Import router cho Cart
const newsRouter = require("./routes/NewsRouter");

// Middleware
// app.use(cors());
app.use(express.json());

// Kết nối MongoDB
// Thay vì mongoose.connect(process.env.MONGO_URL); trực tiếp
if (!process.env.MONGO_URL) {
  console.error(
    "❌ BUG: MONGO_URL is undefined! Check .env and dotenv.config()"
  );
  process.exit(1); // Dừng server để tránh loop
}
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Routes
app.use("/", newsRouter);
// mount error handler cuối cùng
// app.use(errorHandler);

// Server listen
const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`🛒 News Service running on port ${PORT}`);
});
