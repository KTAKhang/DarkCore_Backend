import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import {
  authProxy,
  staffProxy,
  catalogProxy,
  cataloghomeProxy,
  profileProxy,
  customerProxy,
  cartProxy,
  newsProxy,
  orderProxy,
  discountProxy,
  favoriteProxy,
  repairProxy
  productReviewProxy

} from "./routers/proxyRoutes.js";

import { gatewayAuth } from "../middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

app.options(
  "*",
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(morgan("dev"));
// --- Public routes ---
app.use("/auth", authProxy);
app.use("/cataloghome", cataloghomeProxy);
// --- Protected routes ---
app.use("/api/favorites", gatewayAuth, favoriteProxy);
// Catalog service (require JWT)
app.use("/catalog", gatewayAuth, catalogProxy);
app.use("/staff", gatewayAuth, staffProxy);
app.use("/cart", gatewayAuth, cartProxy);
app.use("/profile", gatewayAuth, profileProxy);
app.use("/customer", gatewayAuth, customerProxy);
app.use("/repair", gatewayAuth, repairProxy);
app.use("/review", gatewayAuth, productReviewProxy);
// Order service (require JWT)
app.use("/order", gatewayAuth, orderProxy);
app.use("/discount", gatewayAuth, discountProxy);
app.use("/news", gatewayAuth, newsProxy);

// Health check
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running");
});

// ✅ Fixed syntax: closed string, braces, parentheses
app.listen(PORT, () => {
  console.log(`✅ API Gateway running at http://localhost:${PORT}`);
  console.log(`🔧 Targets →
    AUTH: ${process.env.AUTH_SERVICE_URL || "http://localhost:3001"}
    STAFF: ${process.env.STAFF_SERVICE_URL || "http://localhost:3003"}
    CATALOG: ${process.env.CATALOG_SERVICE_URL || "http://localhost:3002"}
    CATALOGHOME: ${process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004"}
    FAVORITE: ${process.env.FAVORITE_SERVICE_URL || "http://localhost:3009"}
    NEWS: ${process.env.NEWS_SERVICE_URL || "http://localhost:3008"}
    ORDER: ${process.env.ORDER_SERVICE_URL || "http://localhost:3010"}
    DISCOUNT: ${process.env.DISCOUNT_SERVICE_URL || "http://localhost:5005"}
    REPAIR: ${process.env.REPAIR_SERVICE_URL || "http://localhost:4006"}
    CART: ${process.env.CART_SERVICE_URL || "http://localhost:3005"}
    PAYMENT: ${process.env.PAYMENT_SERVICE_URL || "http://localhost:3007"}
  `);
});

