# 📋 Hướng dẫn sử dụng Favorite API

## 🎯 Tổng quan

Hệ thống Favorite đã được refactor hoàn toàn để đảm bảo mỗi user có danh sách yêu thích riêng biệt. Thay vì lưu trạng thái `favorite` trực tiếp trong ProductModel, giờ đây sử dụng FavoriteModel để quản lý mối quan hệ giữa User và Product.

## 🏗️ Kiến trúc

### Models

- **FavoriteModel**: Liên kết giữa `user_id` và `product_id`
- **UserModel**: Model người dùng (đã tồn tại)
- **ProductModel**: Model sản phẩm (đã xóa thuộc tính `favorite`)

### Cấu trúc FavoriteModel

```javascript
{
    user_id: ObjectId,      // Tham chiếu đến users
    product_id: ObjectId,   // Tham chiếu đến products
    createdAt: Date,        // Thời gian thêm vào yêu thích
    updatedAt: Date
}
```

**Lưu ý**: Có compound unique index trên `(user_id, product_id)` để đảm bảo mỗi user chỉ có thể yêu thích 1 sản phẩm 1 lần.

---

## 🔐 Authentication

**Tất cả các endpoint Favorite đều yêu cầu authentication!**

Gửi JWT token trong header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📡 API Endpoints

### 1. **Lấy danh sách yêu thích của user**

```
GET /api/favorites
```

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số lượng/trang (mặc định: 8)
- `keyword` hoặc `name` (optional): Tìm kiếm theo tên sản phẩm
- `brand` (optional): Lọc theo thương hiệu
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa
- `sortBy` (optional): Sắp xếp theo (price, name, createdat)
- `sortOrder` (optional): Thứ tự (asc, desc)

**Response Success (200):**

```json
{
  "status": "OK",
  "data": [
    {
      "_id": "product_id",
      "name": "Tên sản phẩm",
      "price": 100000,
      "images": ["url1", "url2"],
      "brand": "Brand Name",
      "description": "Mô tả ngắn",
      "warrantyDetails": "Chi tiết bảo hành",
      "category": {
        "_id": "category_id",
        "name": "Category Name"
      },
      "isFavorite": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 8,
    "total": 15
  }
}
```

**Example:**

```bash
GET /api/favorites?page=1&limit=10&sortBy=price&sortOrder=asc
```

---

### 2. **Toggle yêu thích (Thêm/Xóa)**

```
POST /api/favorites/toggle/:productId
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": "OK",
  "isFavorite": true,
  "message": "Đã thêm vào danh sách yêu thích"
}
```

hoặc

```json
{
  "status": "OK",
  "isFavorite": false,
  "message": "Đã xóa khỏi danh sách yêu thích"
}
```

**Example:**

```bash
POST /api/favorites/toggle/60d5ec49f1b2c72b8c8e4f1a
```

---

### 3. **Thêm vào yêu thích**

```
POST /api/favorites
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "productId": "60d5ec49f1b2c72b8c8e4f1a"
}
```

**Response Success (200):**

```json
{
  "status": "OK",
  "data": {
    "_id": "favorite_id",
    "user_id": "user_id",
    "product_id": "product_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Đã thêm vào danh sách yêu thích"
}
```

**Response Error (400):**

```json
{
  "status": "ERR",
  "message": "Sản phẩm đã có trong danh sách yêu thích"
}
```

---

### 4. **Xóa khỏi yêu thích**

```
DELETE /api/favorites/:productId
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": "OK",
  "message": "Đã xóa khỏi danh sách yêu thích"
}
```

**Response Error (400):**

```json
{
  "status": "ERR",
  "message": "Sản phẩm không có trong danh sách yêu thích"
}
```

---

### 5. **Kiểm tra 1 sản phẩm có trong yêu thích không**

```
GET /api/favorites/check/:productId
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "status": "OK",
  "isFavorite": true
}
```

**Example:**

```bash
GET /api/favorites/check/60d5ec49f1b2c72b8c8e4f1a
```

---

### 6. **Kiểm tra nhiều sản phẩm (Batch Check)**

```
POST /api/favorites/check-multiple
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "productIds": [
    "60d5ec49f1b2c72b8c8e4f1a",
    "60d5ec49f1b2c72b8c8e4f1b",
    "60d5ec49f1b2c72b8c8e4f1c"
  ]
}
```

**Response Success (200):**

```json
{
  "status": "OK",
  "data": ["60d5ec49f1b2c72b8c8e4f1a", "60d5ec49f1b2c72b8c8e4f1c"]
}
```

_Trả về array chứa các productId nằm trong danh sách yêu thích_

---

## 🔒 Error Responses

### 401 Unauthorized

```json
{
  "status": "ERR",
  "message": "Token không được cung cấp. Vui lòng đăng nhập"
}
```

### 400 Bad Request

```json
{
  "status": "ERR",
  "message": "Không tìm thấy sản phẩm hoặc sản phẩm đang bị ẩn"
}
```

### 500 Internal Server Error

```json
{
  "status": "ERR",
  "message": "Error message details"
}
```

---

## 🎨 Use Cases

### Frontend: Hiển thị icon trái tim

1. Lấy danh sách sản phẩm từ `/api/producthome`
2. Gọi `/api/favorites/check-multiple` với array productIds
3. Dựa vào response để hiển thị icon đỏ (yêu thích) hoặc trắng (chưa yêu thích)

### Frontend: Toggle yêu thích

1. User click vào icon trái tim
2. Gọi `POST /api/favorites/toggle/:productId`
3. Nhận response `isFavorite` để update UI ngay lập tức

### Frontend: Trang danh sách yêu thích

1. Gọi `GET /api/favorites?page=1&limit=12`
2. Hiển thị danh sách với pagination
3. Hỗ trợ filter, search, sort như trang chủ

---

## 🔧 Các thay đổi so với version cũ

### ❌ Đã xóa:

- Thuộc tính `favorite: Boolean` trong ProductModel
- Filter `?favorite=true` trong ProductHomeService
- Routes `/producthome/favorites` và `/producthome/:id/favorite`

### ✅ Đã thêm:

- FavoriteModel với compound unique index
- FavoriteService với 6 methods
- FavoriteController với 6 handlers
- FavoriteRouter với 6 endpoints
- authMiddleware để xác thực JWT

---

## 📝 Notes

1. **Performance**: Sử dụng compound index `(user_id, product_id)` để query nhanh
2. **Data Integrity**: Chỉ lấy products có `status: true` và category `status: true`
3. **User Experience**: Toggle API giúp giảm số lần gọi API từ frontend
4. **Batch Check**: Tối ưu cho việc hiển thị nhiều sản phẩm cùng lúc
5. **Filtering**: Hỗ trợ đầy đủ filter/sort ngay trong danh sách yêu thích

---

## 🚀 Deployment Checklist

- [x] Tạo FavoriteModel
- [x] Xóa thuộc tính favorite khỏi ProductModel
- [x] Tạo FavoriteService
- [x] Tạo FavoriteController
- [x] Tạo authMiddleware
- [x] Tạo FavoriteRouter
- [x] Cập nhật routes/index.js
- [x] Xóa logic favorite cũ
- [ ] **Cập nhật database**: Xóa field `favorite` khỏi products collection
- [ ] **Test API**: Test toàn bộ 6 endpoints
- [ ] **Update Frontend**: Cập nhật code frontend để sử dụng API mới
- [ ] **Documentation**: Cập nhật Swagger/API docs

---

**🎉 Hoàn thành! Mỗi user giờ đây có danh sách yêu thích riêng biệt!**
