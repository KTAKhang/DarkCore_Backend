import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

// Auth Service
export const authProxy = createProxyMiddleware("/auth", {
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
});

// Catalog Service (handles both products and categories)
export const catalogProxy = createProxyMiddleware("/catalog", {
    target: process.env.CATALOG_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: { "^/catalog": "" },
});