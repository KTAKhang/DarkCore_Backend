# 🔧 Fix API Gateway Routing cho Favorites

## ❌ **Lỗi hiện tại:**

```
[HPM] Error occurred while proxying request localhost:3000/api/favorites/check-multiple
to http://localhost:3010/ [ECONNREFUSED]
```

**Nguyên nhân:** API Gateway đang route `/api/favorites/*` đến port **3010** (sai) thay vì cataloghome-service.

---

## ✅ **Giải pháp:**

### **1. Tìm file config API Gateway**

File config thường có tên:

- `gateway.js`
- `proxy.config.js`
- `routes.js`
- `index.js` (trong API Gateway service)

### **2. Cập nhật routing**

**Option A: Route `/api/favorites/*` về cataloghome-service**

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");

// Cataloghome service routes
app.use(
  "/cataloghome",
  createProxyMiddleware({
    target: "http://localhost:3001", // Port của cataloghome-service
    changeOrigin: true,
    pathRewrite: {
      "^/cataloghome": "", // Remove /cataloghome prefix
    },
  })
);

// THÊM ROUTING CHO FAVORITES - Route về cataloghome-service
app.use(
  "/api/favorites",
  createProxyMiddleware({
    target: "http://localhost:3001", // Cùng port với cataloghome
    changeOrigin: true,
    // Không rewrite path vì backend đã có /api/favorites
  })
);
```

**Option B: Gộp chung routing (Khuyến nghị)**

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");

// Cataloghome service - bao gồm cả favorites
app.use(
  ["/cataloghome", "/api/favorites"],
  createProxyMiddleware({
    target: "http://localhost:3001", // Port của cataloghome-service
    changeOrigin: true,
    pathRewrite: {
      "^/cataloghome": "", // Remove /cataloghome prefix
    },
  })
);
```

**Option C: Pattern matching chi tiết hơn**

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");

const CATALOGHOME_SERVICE = "http://localhost:3001";

// Route tất cả cataloghome APIs
app.use(
  "/cataloghome/api",
  createProxyMiddleware({
    target: CATALOGHOME_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/cataloghome": "" },
  })
);

// Route favorites APIs (share authentication với cataloghome)
app.use(
  "/api/favorites",
  createProxyMiddleware({
    target: CATALOGHOME_SERVICE,
    changeOrigin: true,
    // Path giữ nguyên: /api/favorites
  })
);
```

---

## 🎯 **Ví dụ đầy đủ API Gateway config:**

```javascript
// api-gateway/src/index.js hoặc gateway.js
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

// CORS
app.use(cors());
app.use(express.json());

// Service URLs
const SERVICES = {
  AUTH: "http://localhost:3000", // Auth service
  CATALOGHOME: "http://localhost:3001", // Cataloghome service (có favorites)
  ORDER: "http://localhost:3002", // Order service
  // ... other services
};

// Auth routes
app.use(
  "/auth",
  createProxyMiddleware({
    target: SERVICES.AUTH,
    changeOrigin: true,
  })
);

// Cataloghome routes (products, categories)
app.use(
  "/cataloghome/api",
  createProxyMiddleware({
    target: SERVICES.CATALOGHOME,
    changeOrigin: true,
    pathRewrite: { "^/cataloghome": "" },
  })
);

// Favorites routes - QUAN TRỌNG: Phải route về CATALOGHOME service
app.use(
  "/api/favorites",
  createProxyMiddleware({
    target: SERVICES.CATALOGHOME,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `🔄 Proxying ${req.method} ${req.path} to ${SERVICES.CATALOGHOME}`
      );
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error: ${err.message}`);
      res.status(500).json({
        status: "ERR",
        message: "Service temporarily unavailable",
      });
    },
  })
);

// Order routes
app.use(
  "/orders",
  createProxyMiddleware({
    target: SERVICES.ORDER,
    changeOrigin: true,
  })
);

const PORT = process.env.GATEWAY_PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log("📍 Service mappings:");
  console.log(`   /auth → ${SERVICES.AUTH}`);
  console.log(`   /cataloghome → ${SERVICES.CATALOGHOME}`);
  console.log(`   /api/favorites → ${SERVICES.CATALOGHOME}`);
  console.log(`   /orders → ${SERVICES.ORDER}`);
});
```

---

## 🔍 **Debug Steps:**

### 1. Kiểm tra cataloghome-service có chạy không:

```bash
# Kiểm tra service đang chạy ở port nào
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # Mac/Linux

# Hoặc test trực tiếp
curl http://localhost:3001/api/favorites/check-multiple \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["68e140efb1e96d3a94707eea"]}'
```

### 2. Kiểm tra API Gateway config:

```bash
# Tìm file config
grep -r "3010" api-gateway/  # Tìm tất cả references đến port 3010
grep -r "favorites" api-gateway/  # Tìm favorites routing

# Hoặc trong Windows PowerShell
Select-String -Path "api-gateway\*" -Pattern "3010" -Recurse
```

### 3. Restart services theo thứ tự:

```bash
# 1. Restart cataloghome-service
cd cataloghome-service
npm start

# 2. Restart API Gateway
cd ../api-gateway
npm start

# 3. Clear browser cache và test lại
```

---

## 📋 **Checklist:**

- [ ] Tìm và mở file config API Gateway
- [ ] Xác định cataloghome-service đang chạy ở port nào (có thể là 3001, 3005, v.v.)
- [ ] Thêm/sửa routing cho `/api/favorites` về cataloghome-service
- [ ] Xóa hoặc comment routing sai đang point đến port 3010
- [ ] Restart API Gateway
- [ ] Test với curl hoặc Postman
- [ ] Test trên frontend

---

## 🎯 **Port mapping mẫu:**

Thường thì các service chạy như sau:

- Port **3000**: Auth Service
- Port **3001**: Cataloghome Service ← **Favorites ở đây**
- Port **3002**: Order Service
- Port **3010**: ??? (Có thể là service cũ hoặc config sai)
- Port **8080**: API Gateway

---

## 🧪 **Test sau khi fix:**

```bash
# 1. Test qua API Gateway
curl -X POST http://localhost:8080/api/favorites/check-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["68e140efb1e96d3a94707eea"]}'

# 2. Test toggle favorite
curl -X POST http://localhost:8080/api/favorites/toggle/68e140efb1e96d3a94707eea \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test get favorites list
curl -X GET http://localhost:8080/api/favorites \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response: Status **200**, không còn **ECONNREFUSED**

---

## 📝 **Nếu không tìm được file config:**

Có thể API Gateway được config bằng environment variables. Kiểm tra:

```bash
# .env file trong api-gateway
cat api-gateway/.env

# Hoặc
cat api-gateway/.env.development
```

Tìm dòng giống như:

```env
FAVORITES_SERVICE_URL=http://localhost:3010  # ← Sai, cần sửa thành cataloghome
CATALOGHOME_SERVICE_URL=http://localhost:3001
```

Sửa thành:

```env
# Favorites là part của cataloghome service
CATALOGHOME_SERVICE_URL=http://localhost:3001
# hoặc thêm
FAVORITES_SERVICE_URL=http://localhost:3001
```

---

**✅ Sau khi fix API Gateway routing, mọi thứ sẽ hoạt động!**

