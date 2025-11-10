const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4009;
const MONGO_URL = process.env.MONGO_URL || process.env.DATABASE_URL;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
    return res.status(200).json({ status: "OK", message: "Discount Service healthy", data: null });
});

// Routes
const discountRoutes = require("./src/routes/discount.routes");
app.use("/api", discountRoutes);

// DB connect
mongoose
    .connect(MONGO_URL, { autoIndex: true })
    .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(PORT, () => {
            console.log(`Service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect MongoDB:", err?.message || err);
        process.exit(1);
    });


