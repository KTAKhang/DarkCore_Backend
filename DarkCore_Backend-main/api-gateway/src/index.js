import express from "express";
import proxyRoutes from "./routers/proxyRoutes.js";

const app = express();

app.use(proxyRoutes);

app.listen(3000, () => {
  console.log("🚀 API Gateway running at http://localhost:3000");
});
