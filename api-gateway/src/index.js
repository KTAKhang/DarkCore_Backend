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
    orderProxy, // ✅ Thêm import order proxy
} from "./routers/proxyRoutes.js";

import { gatewayAuth } from "../middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS CONFIG - FIX CHO CREDENTIALS =====
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL, // ✅ Dùng URL cụ thể thay vì wildcard
    credentials: true, // ✅ Cho phép gửi cookie/credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

// Xử lý preflight OPTIONS cho tất cả routes
app.options(
  "*",
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(morgan("dev"));

// Public routes (no auth)
app.use("/auth", authProxy);
app.use("/cataloghome", cataloghomeProxy);

// Catalog service - optional authentication (public + authenticated)
app.use("/catalog", gatewayAuth, catalogProxy);

// Staff service (require JWT)
app.use("/staff", gatewayAuth, staffProxy);

app.use("/cart", gatewayAuth, cartProxy);

app.use("/profile", gatewayAuth, profileProxy);
app.use("/customer", gatewayAuth, customerProxy);

// Order service (require JWT)
app.use("/api", gatewayAuth, orderProxy);

// News service (require JWT)
app.use("/news", gatewayAuth, newsProxy);

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running");
});

app.listen(PORT, () => {
  console.log(`✅ API Gateway running at http://localhost:${PORT}`);

  console.log(
    `🔧 Targets → AUTH: ${
      process.env.AUTH_SERVICE_URL || "http://localhost:3001"
    }, STAFF: ${
      process.env.STAFF_SERVICE_URL || "http://localhost:3003"
    }, CATALOG: ${process.env.CATALOG_SERVICE_URL || "http://localhost:3004"},
    , NEWS: ${process.env.NEWS_SERVICE_URL || "http://localhost:3008"}
    , ORDER: ${process.env.ORDER_SERVICE_URL || "http://localhost:3010"}` // ✅ Thêm order service
  );
});