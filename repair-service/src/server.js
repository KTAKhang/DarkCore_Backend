const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const routes = require("./routes");

// Try to load .env from current directory, fallback to parent directory
dotenv.config();
if (!process.env.MONGO_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const app = express();
const port = process.env.PORT || 4006;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
routes(app);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
app.listen(port, () => {
  console.log(`🚀 Repair Service running on port ${port}`);
});
