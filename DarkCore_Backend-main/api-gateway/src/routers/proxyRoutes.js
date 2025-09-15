import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const router = express.Router();

// Auth Service
export const authProxy = createProxyMiddleware("/auth", {
    target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
});

// Staff Service
export const staffProxy = createProxyMiddleware("/staff", {
    target: process.env.STAFF_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: { "^/staff": "" },
});

// Catalog Service (handles both products and categories)
export const catalogProxy = createProxyMiddleware("/catalog", {
    target: process.env.CATALOG_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: { "^/catalog": "" },
});

export default router;
