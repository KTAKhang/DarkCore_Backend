import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import {
    authProxy,

} from "./routers/proxyRoutes.js";

import { gatewayAuth } from "../middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan("dev"));

// Public routes (no auth)
app.use("/auth", authProxy);

// Protected routes (require JWT)
// app.use("/products", gatewayAuth, productProxy);
// app.use("/orders", gatewayAuth, orderProxy);
// app.use("/notify", gatewayAuth, notificationProxy);

// Root endpoint
app.get("/", (req, res) => {
    res.send("🚀 API Gateway is running");
});

app.listen(PORT, () => {
    console.log(`✅ API Gateway running at http://localhost:${PORT}`);
});
