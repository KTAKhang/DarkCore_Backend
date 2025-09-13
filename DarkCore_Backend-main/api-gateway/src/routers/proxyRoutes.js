import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const router = express.Router();


router.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL, // http://localhost:3001
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
  })
);

router.use(
  "/user",
  createProxyMiddleware({
  target: process.env.USER_SERVICE_URL, // http://localhost:3002
    changeOrigin: true,
    pathRewrite: { "^/user": "" },
  })
);


export default router;
