require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const staffRouter = require("./routes/StaffRouter");

// CORS middleware
app.use(cors());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use(express.json());
app.use("/", staffRouter);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Staff Service running on port ${PORT}`);
});
