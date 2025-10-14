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
export const paymentProxy = createProxyMiddleware("/news", {
  target: process.env.NEWS_SERVICE_URL || "http://localhost:3007",
  changeOrigin: true,
  pathRewrite: { "^/payment": "" },
});
export const newsProxy = createProxyMiddleware("/news", {
  target: process.env.NEWS_SERVICE_URL || "http://localhost:3008",
  changeOrigin: true,
  pathRewrite: { "^/news": "" },
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

export default router;

