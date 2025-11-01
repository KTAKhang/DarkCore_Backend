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

// Catalog Service
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
export const productReviewProxy = createProxyMiddleware("/review", {
  target: process.env.USER_SERVICE_URL || "http://localhost:3030",
  changeOrigin: true,
  pathRewrite: { "^/review": "" },
});

export const productReviewGuestProxy = createProxyMiddleware("/review-guest", {
  target: process.env.GUEST_SERVICE_URL || "http://localhost:3213",
  changeOrigin: true,
  pathRewrite: { "^/review-guest": "" },
});

export const saleStaffOrderProxy = createProxyMiddleware("/sale-staff", {
  target: process.env.SALE_STAFF_SERVICE_URL || "http://localhost:3215",
  changeOrigin: true,
  pathRewrite: { "^/sale-staff": "" },
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


// About Service Proxy (Thông tin About Us và Founders)
export const aboutProxy = createProxyMiddleware("/about", {
  target: process.env.ABOUT_SERVICE_URL || "http://localhost:3006",
  changeOrigin: true,
  pathRewrite: { "^/about": "" },
  onProxyReq: function (proxyReq, req, res) {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    if (req.headers.authorization) {
      proxyReq.setHeader("authorization", req.headers.authorization);
    }
  },
  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },
  onError: function (err, req, res) {
    res.status(500).send("About service unavailable");
  },
});


export const paymentProxy = createProxyMiddleware("/payment", {
  target: process.env.PAYMENT_SERVICE_URL || "http://localhost:3007",
  changeOrigin: true,
  pathRewrite: { "^/payment": "/api/payment" },
  onProxyReq: function (proxyReq, req, res) {
    console.log('🔍 Payment Proxy - Request:', req.method, req.url);
    console.log('🔍 Payment Proxy - Headers:', req.headers.authorization ? 'Has token' : 'No token');
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    if (req.headers.authorization) {
      proxyReq.setHeader("authorization", req.headers.authorization);
    }
    console.log('🔍 Payment Proxy - Forwarding to:', process.env.PAYMENT_SERVICE_URL || "http://localhost:3007");
  },
  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },
  onError: function (err, req, res) {
    res.status(500).send("Payment service unavailable");
  },
});

export const newsProxy = createProxyMiddleware("/news", {
  target: process.env.NEWS_SERVICE_URL || "http://localhost:3008",
  changeOrigin: true,
  pathRewrite: { "^/news": "" },
});
export const contactProxy = createProxyMiddleware("/contacts", {
  target: process.env.CONTACT_SERVICE_URL || "http://localhost:3020",
  changeOrigin: true,
  pathRewrite: { "^/contacts": "/contacts" },
});
// Order Service Proxy
export const orderProxy = createProxyMiddleware("/order", {
  target: process.env.ORDER_SERVICE_URL || "http://localhost:3010",
  changeOrigin: true,
  pathRewrite: { "^/order": "" },
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
    res.status(500).send("Order service unavailable");
  },
});

// Discount Service Proxy
export const discountProxy = createProxyMiddleware("/discount", {
  target: process.env.DISCOUNT_SERVICE_URL || "http://localhost:4009",
  changeOrigin: true,
  // Map gateway prefix /discount -> service /api
  pathRewrite: { "^/discount": "/api" },
  onProxyReq: function (proxyReq, req, res) {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    if (req.headers.authorization) {
      proxyReq.setHeader("authorization", req.headers.authorization);
    }
    // forward x-user header set by gatewayAuth
    if (req.headers["x-user"]) {
      proxyReq.setHeader("x-user", req.headers["x-user"]);
    }
  },
  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },
  onError: function (err, req, res) {
    res.status(500).send("Discount service unavailable");
  },
});

// ✅ Favorite Service (part of CatalogHome - port 3004)
export const favoriteProxy = createProxyMiddleware("/api/favorites", {
  target: process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004",
  changeOrigin: true,
  pathRewrite: { "^/api/favorites": "/api/favorites" },
  onProxyReq: function (proxyReq, req, res) {
    if (req.headers.cookie) {
      proxyReq.setHeader("cookie", req.headers.cookie);
    }
    if (req.headers.authorization) {
      proxyReq.setHeader("authorization", req.headers.authorization);
    }
  },
  onProxyRes: function (proxyRes, req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    proxyRes.headers["access-control-allow-origin"] = frontendUrl;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  },
  onError: function (err, req, res) {
    res.status(500).send("Favorite service unavailable");
  },
});

// Repair Service
export const repairProxy = createProxyMiddleware("/repair", {
  target: process.env.REPAIR_SERVICE_URL || "http://localhost:4006",
  changeOrigin: true,
  pathRewrite: { "^/repair": "" },
});
console.log("CART_SERVICE_URL =", process.env.CART_SERVICE_URL);

export default router;