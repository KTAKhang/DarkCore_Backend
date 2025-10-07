# 🔐 Auth Middleware Guide

## 📌 Tổng quan

File `authMiddleware.js` cung cấp 4 middleware xác thực khác nhau để sử dụng trong các routes:

## 🛡️ Các Middleware Available

### 1. **verifyToken** - Xác thực JWT cơ bản

Chỉ verify token và lưu thông tin vào `req.user`, không query database.

**Sử dụng khi:**

- Chỉ cần xác thực user đã đăng nhập
- Không cần thông tin chi tiết từ database
- Muốn tối ưu performance (không query DB)

**Kết quả:**

```javascript
req.user = {
  _id: "user_id",
  role: "role_from_token",
  isAdmin: true / false,
};
```

---

### 2. **authUserMiddleware** - Middleware cho user đã login

Verify token và lưu thông tin user (tương tự verifyToken nhưng format tương thích hơn).

**Sử dụng khi:**

- Bất kỳ user nào đã đăng nhập đều được phép
- Không phân biệt role (admin, customer, etc.)
- **Dùng cho Favorite API**

**Ví dụ:**

```javascript
router.get("/favorites", authUserMiddleware, FavoriteController.getFavorites);
```

**Kết quả:**

```javascript
req.user = {
  id: "user_id",
  _id: "user_id", // Cả 2 format để tương thích
  role: "role_from_token",
  isAdmin: true / false,
};
```

---

### 3. **authAdminMiddleware** - Middleware chỉ cho Admin

Verify token + Query database + Kiểm tra role = "admin".

**Sử dụng khi:**

- Chỉ admin mới được phép truy cập
- Cần query database để lấy role_id từ UserModel
- **Dùng cho Admin Panel, Dashboard**

**Ví dụ:**

```javascript
router.delete("/products/:id", authAdminMiddleware, ProductController.delete);
```

**Kết quả:**

```javascript
req.user = {
  _id: "user_id",
  user_name: "Admin Name",
  email: "admin@example.com",
  role_id: {
    _id: "role_id",
    name: "admin",
  },
  // ... các field khác từ UserModel
};
```

**Response lỗi nếu không phải admin:**

```json
{
  "status": "ERR",
  "message": "Bạn không có quyền truy cập. Chỉ admin mới có thể thực hiện thao tác này"
}
```

---

### 4. **authMiddleware** - Middleware cho User hoặc Admin

Verify token + Query database + Cho phép admin HOẶC chính user đó truy cập.

**Sử dụng khi:**

- User có thể truy cập resource của chính họ
- Admin có thể truy cập tất cả resources
- **Dùng cho User Profile, Orders**

**Ví dụ:**

```javascript
// User chỉ có thể xem/sửa profile của chính mình
// Admin có thể xem/sửa profile của bất kỳ ai
router.get("/users/:id", authMiddleware, UserController.getProfile);
router.put("/users/:id", authMiddleware, UserController.updateProfile);
```

**Logic:**

- Nếu `userData.role_id.name === "admin"` → Cho phép
- Nếu `decoded._id === req.params.id` → Cho phép (chính user đó)
- Các trường hợp khác → 403 Forbidden

**Kết quả:**

```javascript
req.user = {
  _id: "user_id",
  user_name: "User Name",
  email: "user@example.com",
  role_id: {
    _id: "role_id",
    name: "customer", // hoặc "admin"
  },
  // ... các field khác từ UserModel
};
```

---

## 🎯 So sánh nhanh

| Middleware            | Verify Token | Query DB |  Kiểm tra Role   | Use Case         |
| --------------------- | :----------: | :------: | :--------------: | ---------------- |
| `verifyToken`         |      ✅      |    ❌    |        ❌        | Xác thực cơ bản  |
| `authUserMiddleware`  |      ✅      |    ❌    |        ❌        | **Favorite API** |
| `authAdminMiddleware` |      ✅      |    ✅    |  ✅ Admin only   | Admin CRUD       |
| `authMiddleware`      |      ✅      |    ✅    | ✅ Admin or Self | User Profile     |

---

## 📝 Cách sử dụng

### Import middleware:

```javascript
const {
  authUserMiddleware,
  authAdminMiddleware,
  authMiddleware,
} = require("../middleware/authMiddleware");
```

### Áp dụng cho toàn bộ router:

```javascript
// Tất cả routes trong router này đều yêu cầu user đăng nhập
router.use(authUserMiddleware);

router.get("/favorites", FavoriteController.getFavorites);
router.post("/favorites", FavoriteController.addFavorite);
```

### Áp dụng cho từng route:

```javascript
// Route public
router.get("/products", ProductController.list);

// Route chỉ cho user đã login
router.get("/my-orders", authUserMiddleware, OrderController.myOrders);

// Route chỉ cho admin
router.delete("/products/:id", authAdminMiddleware, ProductController.delete);

// Route cho admin hoặc chính user đó
router.get("/users/:id", authMiddleware, UserController.getProfile);
```

---

## 🔒 Error Responses

### 401 Unauthorized - Không có token

```json
{
  "status": "ERR",
  "message": "Token không được cung cấp. Vui lòng đăng nhập"
}
```

### 401 Unauthorized - Token không hợp lệ

```json
{
  "status": "ERR",
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

### 403 Forbidden - Không đủ quyền

```json
{
  "status": "ERR",
  "message": "Bạn không có quyền truy cập"
}
```

### 404 Not Found - User không tồn tại (chỉ authMiddleware)

```json
{
  "status": "ERR",
  "message": "Không tìm thấy user"
}
```

### 500 Internal Server Error

```json
{
  "status": "ERR",
  "message": "Internal server error"
}
```

---

## 🌟 Best Practices

1. **Chọn middleware phù hợp:**

   - Favorite, Cart → `authUserMiddleware` (không cần phân biệt role)
   - Admin CRUD → `authAdminMiddleware`
   - User profile → `authMiddleware` (admin + self)

2. **Performance:**

   - `authUserMiddleware` nhanh hơn vì không query DB
   - Dùng `authAdminMiddleware` chỉ khi cần kiểm tra role từ DB

3. **Security:**

   - Luôn validate `req.user` trong controller
   - Sử dụng `req.user?.id || req.user?._id` để tương thích cả 2 format

4. **Testing:**
   - Test với token hợp lệ
   - Test với token hết hạn
   - Test với user không có quyền
   - Test với admin

---

## 🚀 Integration với Favorite API

File `FavoriteRouter.js` đã sử dụng `authUserMiddleware`:

```javascript
const { authUserMiddleware } = require("../middleware/authMiddleware");

router.use(authUserMiddleware); // Áp dụng cho tất cả routes

router.get("/favorites", FavoriteController.getFavorites);
router.post("/favorites/toggle/:productId", FavoriteController.toggleFavorite);
// ... các routes khác
```

File `FavoriteController.js` lấy userId:

```javascript
const userId = req.user?.id || req.user?._id; // Tương thích cả 2 format
```

---

## ⚙️ Environment Variables Required

```env
ACCESS_TOKEN_SECRET=your_secret_key_here
```

---

**✅ Đã hoàn thành! AuthMiddleware tương thích với cả service cũ và service mới!**
