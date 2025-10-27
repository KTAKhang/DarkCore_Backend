# Catalog Service

Microservice quản lý danh mục và sản phẩm cho hệ thống DarkCore Backend.

## Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc với các biến sau:

```env
# Database Configuration
DB_CONNECTION_STRING=your_mongodb_connection_string

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Auth Service Configuration (QUAN TRỌNG)
AUTH_SERVICE_URL=http://localhost:3001

# Cloudinary Configuration (nếu sử dụng)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=3002
```

## Cài đặt và Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy service
npm start
```

## Cập nhật Authentication

Service đã được cập nhật để tự động refresh token khi hết hạn, tương thích với auth service có token hết hạn mỗi 1 phút.

### Middleware mới:

- `tokenMiddleware`: Xử lý token chung với auto-refresh
- `authAdminMiddleware`: Chỉ admin, với auto-refresh
- `authAdminSalesMiddleware`: Admin và sales-staff, với auto-refresh
- `authMiddleware`: Kiểm tra quyền truy cập user
- `authStaffMiddleware`: Chỉ cần đăng nhập

### Cách sử dụng:

```javascript
// Sử dụng tokenMiddleware trước các middleware khác
app.use("/api/products", tokenMiddleware, authAdminMiddleware, productRoutes);
```

## API Endpoints

- `/api/categories` - Quản lý danh mục
- `/api/products` - Quản lý sản phẩm

## Dependencies

- `axios`: Để gọi API refresh token từ auth service
- `jsonwebtoken`: Xử lý JWT tokens
- `mongoose`: Kết nối MongoDB
- `express`: Web framework
