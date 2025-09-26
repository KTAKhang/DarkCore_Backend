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

    // ✅ Forward cookies
    onProxyReq: function (proxyReq, req, res) {
        if (req.headers.cookie) {
            proxyReq.setHeader("cookie", req.headers.cookie);
        }
    },

    // ✅ Forward CORS + Set-Cookie từ BE → FE
    onProxyRes: function (proxyRes, req, res) {
        const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:5173";
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

// Staff Service nhớ đổi tên lại từ staff-service về user-service cho tường minh
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
// Staff Service///

// Catalog Home Service
export const cataloghomeProxy = createProxyMiddleware("/cataloghome", {
    target: process.env.CATALOGHOME_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    pathRewrite: { "^/cataloghome": "" },
});

export default router;
