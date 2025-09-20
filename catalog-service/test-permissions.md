# Test Cases cho Hệ thống Phân quyền

## 🔐 Phân quyền đã implement:

### **Categories:**

- **GET** `/categories/*` - Tất cả user đã login
- **POST/PUT/DELETE** `/categories/*` - Chỉ Admin

### **Products:**

- **GET** `/products/*` - Tất cả user đã login
- **POST/PUT** `/products/*` - Admin + Technician
- **DELETE** `/products/*` - Chỉ Admin

## 🧪 Test Cases:

### 1. **Customer Role** (role: "customer")

```bash
# ✅ Nên thành công
GET /catalog/categories
GET /catalog/categories/123
GET /catalog/products
GET /catalog/products/123

# ❌ Nên bị từ chối (403)
POST /catalog/categories
PUT /catalog/categories/123
DELETE /catalog/categories/123
POST /catalog/products
PUT /catalog/products/123
DELETE /catalog/products/123
```

### 2. **Technician Role** (role: "technician")

```bash
# ✅ Nên thành công
GET /catalog/categories
GET /catalog/categories/123
GET /catalog/products
GET /catalog/products/123
POST /catalog/products
PUT /catalog/products/123

# ❌ Nên bị từ chối (403)
POST /catalog/categories
PUT /catalog/categories/123
DELETE /catalog/categories/123
DELETE /catalog/products/123
```

### 3. **Admin Role** (role: "admin")

```bash
# ✅ Tất cả đều nên thành công
GET /catalog/categories
GET /catalog/categories/123
GET /catalog/products
GET /catalog/products/123
POST /catalog/categories
PUT /catalog/categories/123
DELETE /catalog/categories/123
POST /catalog/products
PUT /catalog/products/123
DELETE /catalog/products/123
```

### 4. **Không có token** (401)

```bash
# ❌ Tất cả đều nên bị từ chối (401)
GET /catalog/categories
POST /catalog/categories
# ... tất cả routes
```

## 🔧 Cách test:

1. **Cập nhật API Gateway:**

   ```javascript
   // Trong index.js của API Gateway
   app.use("/catalog", gatewayAuth, catalogProxy);
   ```

2. **Khởi động services:**

   ```bash
   # Terminal 1: API Gateway
   cd api-gateway && npm start

   # Terminal 2: Catalog Service
   cd catalog-service && npm start
   ```

3. **Test với Postman/curl:**

   ```bash
   # Lấy token từ auth service trước
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"password"}'

   # Sử dụng token để test catalog
   curl -X GET http://localhost:3000/catalog/categories \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## 📝 Expected Responses:

### Success (200/201):

```json
{
  "status": "OK",
  "data": [...],
  "pagination": {...}
}
```

### Unauthorized (401):

```json
{
  "message": "No user data",
  "status": "ERR"
}
```

### Forbidden (403):

```json
{
  "message": "Access denied. Required roles: admin",
  "status": "ERR"
}
```
