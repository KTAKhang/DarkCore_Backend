# 🔧 FIX API GATEWAY - Favorites Routing

## ❌ **Vấn đề hiện tại:**

```javascript
// Trong index.js - Đang route TẤT CẢ /api/* đến Order Service
app.use("/api", gatewayAuth, orderProxy);
```

Request `/api/favorites/*` đang bị route nhầm đến **Order Service (port 3010)** thay vì **Cataloghome Service (port 3004)**.

---

## ✅ **GIẢI PHÁP:**

### **Bước 1: Thêm Favorites Proxy vào `proxyRoutes.js`**

```javascript
// src/routers/proxyRoutes.js

// ... existing imports ...

// ✅ THÊM: Favorites Proxy (route về cataloghome service)
export const favoritesProxy = createProxyMiddleware("/api/favorites", {
  target: process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004",
  changeOrigin: true,
  // Không pathRewrite vì backend đã có /api/favorites

  onProxyReq: function (proxyReq, req, res) {
    // Forward cookies nếu cần
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    console.log(
      `🔄 Proxying ${req.method} ${req.originalUrl} to Cataloghome Service`
    );
  },

  onError: function (err, req, res) {
    console.error(`❌ Favorites proxy error: ${err.message}`);
    res.status(500).send("Favorites service unavailable");
  },
});

// ... rest of code ...
```

### **Bước 2: Cập nhật `index.js` - Thêm route cho Favorites**

```javascript
// src/index.js

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
  favoritesProxy, // ✅ THÊM import này
} from "./routers/proxyRoutes.js";

// ... existing code ...

// ===== ROUTING =====

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

// ✅ THÊM: Favorites service (require JWT) - ĐẶT TRƯỚC ORDER
app.use("/api/favorites", gatewayAuth, favoritesProxy);

// ⚠️ Order service (require JWT) - ĐẶT SAU FAVORITES
app.use("/api", gatewayAuth, orderProxy);

// News service (require JWT)
app.use("/news", gatewayAuth, newsProxy);

// ... rest of code ...
```

### **⚠️ LƯU Ý QUAN TRỌNG:**

```javascript
// ✅ ĐÚNG - Route cụ thể trước, route chung sau
app.use("/api/favorites", gatewayAuth, favoritesProxy); // ← Cụ thể
app.use("/api", gatewayAuth, orderProxy); // ← Chung

// ❌ SAI - Nếu đảo ngược thì /api/* sẽ match trước
app.use("/api", gatewayAuth, orderProxy); // ← Này match hết
app.use("/api/favorites", gatewayAuth, favoritesProxy); // ← Không bao giờ chạy đến
```

**Express routing:** Route cụ thể phải đặt **TRƯỚC** route chung!

---

## 📄 **FILE ĐẦY ĐỦ:**

### **`src/routers/proxyRoutes.js`** (Đầy đủ)

```javascript
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const router = express.Router();

// Auth Service Proxy
export const authProxy = createProxyMiddleware("/auth", {
  target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  changeOrigin: true,
  pathRewrite: { "^/auth": "" },

  onProxyReq: function (proxyReq, req, res) {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
  },

  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },

  onError: function (err, req, res) {
    res.status(500).send("Auth service unavailable");
  },
});

// Catalog Service (handles both products and categories)
export const catalogProxy = createProxyMiddleware("/catalog", {
  target: process.env.CATALOG_SERVICE_URL || "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { "^/catalog": "" },
});

// Staff Service
export const staffProxy = createProxyMiddleware("/staff", {
  target: process.env.STAFF_SERVICE_URL || "http://localhost:3003",
  changeOrigin: true,
  pathRewrite: { "^/staff": "" },
});

export const profileProxy = createProxyMiddleware("/profile", {
  target: process.env.USER_SERVICE_URL || "http://localhost:3210",
  changeOrigin: true,
  pathRewrite: { "^/profile": "" },
});

export const customerProxy = createProxyMiddleware("/customer", {
  target: process.env.USER_SERVICE_URL || "http://localhost:3210",
  changeOrigin: true,
  pathRewrite: { "^/customer": "" },
});

// Catalog Home Service
export const cataloghomeProxy = createProxyMiddleware("/cataloghome", {
  target: process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004",
  changeOrigin: true,
  pathRewrite: { "^/cataloghome": "" },
});

export const cartProxy = createProxyMiddleware("/cart", {
  target: process.env.CART_SERVICE_URL || "http://localhost:3005",
  changeOrigin: true,
  pathRewrite: { "^/cart": "" },
});

export const newsProxy = createProxyMiddleware("/news", {
  target: process.env.NEWS_SERVICE_URL || "http://localhost:3008",
  changeOrigin: true,
  pathRewrite: { "^/news": "" },
});

// ✅ THÊM MỚI: Favorites Proxy (route về cataloghome service)
export const favoritesProxy = createProxyMiddleware("/api/favorites", {
  target: process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004",
  changeOrigin: true,
  // Không pathRewrite vì backend đã có /api/favorites

  onProxyReq: function (proxyReq, req, res) {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    console.log(
      `🔄 [Favorites] Proxying ${req.method} ${req.originalUrl} to ${
        process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004"
      }`
    );
  },

  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },

  onError: function (err, req, res) {
    console.error(`❌ Favorites proxy error: ${err.message}`);
    res.status(500).send("Favorites service unavailable");
  },
});

// Order Service Proxy
export const orderProxy = createProxyMiddleware("/api", {
  target: process.env.ORDER_SERVICE_URL || "http://localhost:3010",
  changeOrigin: true,
  pathRewrite: { "^/api": "/api" },

  onProxyReq: function (proxyReq, req, res) {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    console.log(
      `🔄 [Order] Proxying ${req.method} ${req.originalUrl} to ${
        process.env.ORDER_SERVICE_URL || "http://localhost:3010"
      }`
    );
  },

  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },

  onError: function (err, req, res) {
    console.error(`❌ Order proxy error: ${err.message}`);
    res.status(500).send("Order service unavailable");
  },
});

export default router;
```

### **`src/index.js`** (Đầy đủ)

```javascript
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
  favoritesProxy, // ✅ THÊM import
} from "./routers/proxyRoutes.js";

import { gatewayAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS CONFIG =====
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
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

// Xử lý preflight OPTIONS
app.options(
  "*",
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(morgan("dev"));

// ===== ROUTING =====

// Public routes (no auth)
app.use("/auth", authProxy);
app.use("/cataloghome", cataloghomeProxy);

// Catalog service
app.use("/catalog", gatewayAuth, catalogProxy);

// Staff service
app.use("/staff", gatewayAuth, staffProxy);

// Cart service
app.use("/cart", gatewayAuth, cartProxy);

// Profile & Customer
app.use("/profile", gatewayAuth, profileProxy);
app.use("/customer", gatewayAuth, customerProxy);

// ✅ FAVORITES - ĐẶT TRƯỚC ORDER (route cụ thể trước route chung)
app.use("/api/favorites", gatewayAuth, favoritesProxy);

// ⚠️ ORDER - ĐẶT SAU FAVORITES
app.use("/api", gatewayAuth, orderProxy);

// News service
app.use("/news", gatewayAuth, newsProxy);

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running");
});

app.listen(PORT, () => {
  console.log(`✅ API Gateway running at http://localhost:${PORT}`);
  console.log("📍 Service mappings:");
  console.log(
    `   /auth → ${process.env.AUTH_SERVICE_URL || "http://localhost:3001"}`
  );
  console.log(
    `   /staff → ${process.env.STAFF_SERVICE_URL || "http://localhost:3003"}`
  );
  console.log(
    `   /catalog → ${
      process.env.CATALOG_SERVICE_URL || "http://localhost:3002"
    }`
  );
  console.log(
    `   /cataloghome → ${
      process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004"
    }`
  );
  console.log(
    `   /cart → ${process.env.CART_SERVICE_URL || "http://localhost:3005"}`
  );
  console.log(
    `   /news → ${process.env.NEWS_SERVICE_URL || "http://localhost:3008"}`
  );
  console.log(
    `   /api/favorites → ${
      process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004"
    } ✅`
  );
  console.log(
    `   /api → ${process.env.ORDER_SERVICE_URL || "http://localhost:3010"}`
  );
});
```

---

## 🧪 **Test sau khi fix:**

### 1. Restart API Gateway:

```bash
cd api-gateway
npm run dev
# hoặc
npm start
```

### 2. Kiểm tra log khi gọi API:

Bạn sẽ thấy:

```
🔄 [Favorites] Proxying POST /api/favorites/check-multiple to http://localhost:3004
```

Thay vì:

```
❌ [Order] Proxying POST /api/favorites/... to http://localhost:3010
```

### 3. Test với curl:

```bash
# Test favorites
curl -X POST http://localhost:3000/api/favorites/check-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["68e140efb1e96d3a94707eea"]}'

# Test toggle
curl -X POST http://localhost:3000/api/favorites/toggle/68e140efb1e96d3a94707eea \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Status **200**, không còn **ECONNREFUSED**

---

## ✅ **Checklist:**

- [ ] Thêm `favoritesProxy` vào `proxyRoutes.js`
- [ ] Import `favoritesProxy` trong `index.js`
- [ ] Đặt route `/api/favorites` **TRƯỚC** route `/api`
- [ ] Restart API Gateway
- [ ] Test API với Postman hoặc frontend
- [ ] Kiểm tra log console thấy routing đúng

---

**🎉 Sau khi fix, Favorites sẽ route về Cataloghome Service (port 3004) thay vì Order Service (port 3010)!**
