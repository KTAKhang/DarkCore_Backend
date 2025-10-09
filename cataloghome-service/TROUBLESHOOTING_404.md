# 🔍 Troubleshooting: 404 Error - Cannot POST /favorites/toggle/...

## ❌ **Lỗi hiện tại:**

```
POST /favorites/toggle/68e140efb1e96d3a94707eea 404 (Not Found)
Cannot POST /favorites/toggle/68e140efb1e96d3a94707eea
```

## 🔎 **Phân tích:**

Từ terminal API Gateway:

- ✅ `/cataloghome/api/categoryhome` → Works (có prefix `/cataloghome/api`)
- ✅ `/cataloghome/api/producthome` → Works (có prefix `/cataloghome/api`)
- ❌ `/favorites/toggle/...` → 404 (thiếu prefix)

## 🎯 **Nguyên nhân:**

API Gateway đang routing như sau:

- `/cataloghome/*` → Đến `cataloghome-service`
- Nhưng request `/favorites/*` **không có prefix `/cataloghome`**

## ✅ **Giải pháp:**

### **Cách 1: Fix Frontend URL (Khuyến nghị)**

Cập nhật file `favoriteSaga.js` hoặc file API config của frontend:

```javascript
// ❌ SAI - Thiếu prefix cataloghome
export const apiToggleFavorite = (productId) =>
  axios.post(`/favorites/toggle/${productId}`);

export const apiCheckMultipleFavorites = (productIds) =>
  axios.post(`/favorites/check-multiple`, { productIds });

export const apiGetFavorites = (params) => axios.get(`/favorites`, { params });

// ✅ ĐÚNG - Thêm prefix cataloghome
export const apiToggleFavorite = (productId) =>
  axios.post(`/cataloghome/api/favorites/toggle/${productId}`);

export const apiCheckMultipleFavorites = (productIds) =>
  axios.post(`/cataloghome/api/favorites/check-multiple`, { productIds });

export const apiGetFavorites = (params) =>
  axios.get(`/cataloghome/api/favorites`, { params });
```

### **Cách 2: Fix API Gateway Routing**

Nếu bạn muốn `/favorites/*` tự động route đến `cataloghome-service`, cập nhật config API Gateway:

**API Gateway config (ví dụ với Express):**

```javascript
// Thêm routing cho favorites
app.use(
  "/favorites",
  createProxyMiddleware({
    target: "http://cataloghome-service:3000",
    pathRewrite: { "^/favorites": "/api/favorites" },
    changeOrigin: true,
  })
);

// Hoặc pattern chung hơn
app.use(
  ["/cataloghome", "/favorites"],
  createProxyMiddleware({
    target: "http://cataloghome-service:3000",
    pathRewrite: {
      "^/cataloghome": "",
      "^/favorites": "/api/favorites",
    },
    changeOrigin: true,
  })
);
```

### **Cách 3: Tạo baseURL riêng cho Favorite API**

Trong frontend, tạo axios instance riêng:

```javascript
// api/favoriteApi.js
import axios from "axios";

const favoriteApi = axios.create({
  baseURL: "/cataloghome/api/favorites", // Base URL cho favorites
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để thêm token
favoriteApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default favoriteApi;
```

Sau đó sử dụng:

```javascript
// favoriteSaga.js
import favoriteApi from "./api/favoriteApi";

export const apiToggleFavorite = (productId) =>
  favoriteApi.post(`/toggle/${productId}`); // Không cần prefix nữa

export const apiCheckMultipleFavorites = (productIds) =>
  favoriteApi.post(`/check-multiple`, { productIds });

export const apiGetFavorites = (params) => favoriteApi.get("/", { params });
```

---

## 🔄 **So sánh URL:**

| Endpoint       | Frontend gọi (SAI)          | Frontend gọi (ĐÚNG)                         | Backend route                   |
| -------------- | --------------------------- | ------------------------------------------- | ------------------------------- |
| Toggle         | `/favorites/toggle/:id`     | `/cataloghome/api/favorites/toggle/:id`     | `/api/favorites/toggle/:id`     |
| Check Multiple | `/favorites/check-multiple` | `/cataloghome/api/favorites/check-multiple` | `/api/favorites/check-multiple` |
| Get Favorites  | `/favorites`                | `/cataloghome/api/favorites`                | `/api/favorites`                |
| Check One      | `/favorites/check/:id`      | `/cataloghome/api/favorites/check/:id`      | `/api/favorites/check/:id`      |
| Add            | `/favorites` (POST)         | `/cataloghome/api/favorites` (POST)         | `/api/favorites` (POST)         |
| Remove         | `/favorites/:id` (DELETE)   | `/cataloghome/api/favorites/:id` (DELETE)   | `/api/favorites/:id` (DELETE)   |

---

## 📝 **Checklist:**

- [ ] Kiểm tra file `favoriteSaga.js` hoặc file API config
- [ ] Thêm prefix `/cataloghome/api` vào tất cả favorite endpoints
- [ ] Hoặc cập nhật API Gateway routing
- [ ] Test lại với Postman/curl để đảm bảo route đúng
- [ ] Clear cache trình duyệt và reload

---

## 🧪 **Test với curl:**

```bash
# Test từ frontend/browser (qua API Gateway)
curl -X POST http://localhost:8080/cataloghome/api/favorites/toggle/68e140efb1e96d3a94707eea \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test trực tiếp cataloghome-service (không qua gateway)
curl -X POST http://localhost:3000/api/favorites/toggle/68e140efb1e96d3a94707eea \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 **Recommended Solution:**

**Fix frontend URLs** - Đây là cách đơn giản và rõ ràng nhất:

1. Tìm file định nghĩa API calls (thường là `favoriteSaga.js`, `favoriteApi.js`, hoặc `api/index.js`)
2. Thêm prefix `/cataloghome/api` vào tất cả favorite endpoints
3. Test lại

**Ví dụ đầy đủ:**

```javascript
// frontend/src/api/favoriteApi.js
import axios from "./axiosConfig"; // axios instance đã config sẵn

const BASE_URL = "/cataloghome/api/favorites";

export const favoriteApi = {
  toggleFavorite: (productId) => axios.post(`${BASE_URL}/toggle/${productId}`),

  checkMultiple: (productIds) =>
    axios.post(`${BASE_URL}/check-multiple`, { productIds }),

  getFavorites: (params) => axios.get(BASE_URL, { params }),

  checkOne: (productId) => axios.get(`${BASE_URL}/check/${productId}`),

  addFavorite: (productId) => axios.post(BASE_URL, { productId }),

  removeFavorite: (productId) => axios.delete(`${BASE_URL}/${productId}`),
};
```

---

**✅ Fix URL frontend và mọi thứ sẽ hoạt động!**

