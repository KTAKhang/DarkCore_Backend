# About Service

Microservice quản lý thông tin About Us và Founders cho hệ thống DarkCore Backend.

## 📋 Mục đích

Service này cung cấp API để:

- Hiển thị thông tin về cửa hàng (About Us page)
- Quản lý thông tin CEO và các đồng sáng lập
- Cung cấp dữ liệu cho trang giới thiệu của website

## 🎯 Tính năng

### **About Us**

- Thông tin cơ bản: Tên cửa hàng, logo, slogan
- Câu chuyện hình thành
- Tầm nhìn, sứ mệnh, giá trị cốt lõi
- Thông tin liên hệ: Email, điện thoại, địa chỉ
- Social media links
- Thống kê: Số năm hoạt động, số khách hàng, số sản phẩm
- Hình ảnh cửa hàng
- Giờ làm việc

### **Founders/CEO**

- Thông tin cá nhân: Tên, chức vụ, ảnh đại diện
- Tiểu sử
- Quote/Trích dẫn
- Thông tin liên hệ
- Social media links
- Thành tựu
- Thứ tự hiển thị

## 🔧 Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc với các biến sau:

```env
# Database Configuration
MONGO_URL=your_mongodb_connection_string

# JWT Configuration (nếu cần auth)
ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Auth Service Configuration (để verify token)
AUTH_SERVICE_URL=http://localhost:3001

# Cloudinary Configuration (để upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=3005
```

## 📦 Cài đặt và Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy service
npm start

# Hoặc chạy với nodemon (development)
npm run dev
```

## 🌐 API Endpoints

### **Public Endpoints (Không cần authentication)**

#### About Us

- `GET /about` - Lấy thông tin About Us

#### Founders

- `GET /founders` - Lấy danh sách Founders
- `GET /founders/:id` - Lấy chi tiết Founder theo ID

---

### **Admin Endpoints (Cần authentication)**

#### About Us Management

- `POST /admin/about` - Tạo hoặc cập nhật thông tin About Us
- `GET /admin/about` - Lấy thông tin About Us (bao gồm inactive)
- `PUT /admin/about/status` - Cập nhật trạng thái
- `PUT /admin/about/stats` - Cập nhật thống kê
- `DELETE /admin/about` - Xóa (soft delete)

#### Founders Management

- `POST /admin/founders` - Tạo Founder mới
- `GET /admin/founders` - Lấy tất cả Founders (bao gồm inactive)
  - Query params: `status`, `isActive`
- `GET /admin/founders/:id` - Lấy chi tiết Founder
- `PUT /admin/founders/:id` - Cập nhật Founder
- `DELETE /admin/founders/:id` - Xóa (soft delete)
- `DELETE /admin/founders/:id/permanent` - Xóa vĩnh viễn
- `PUT /admin/founders/:id/sort-order` - Cập nhật thứ tự hiển thị

## 📚 API Documentation

Swagger UI có sẵn tại:

```
http://localhost:3005/api-docs
```

## 📊 Database Models

### **AboutModel**

```javascript
{
  storeName: String (required),
  slogan: String,
  logo: String,
  story: String (required),
  mission: String,
  vision: String,
  coreValues: [{
    title: String,
    description: String,
    icon: String
  }],
  email: String (required),
  phone: String (required),
  address: String (required),
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
    linkedin: String
  },
  stats: {
    yearsOfOperation: Number,
    totalCustomers: Number,
    totalProducts: Number,
    totalOrders: Number
  },
  images: [String],
  workingHours: String,
  isActive: Boolean,
  status: Boolean
}
```

### **FounderModel**

```javascript
{
  fullName: String (required),
  position: String (required),
  avatar: String,
  bio: String (required),
  quote: String,
  email: String,
  phone: String,
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },
  achievements: [{
    title: String,
    description: String,
    year: Number
  }],
  sortOrder: Number,
  isActive: Boolean,
  status: Boolean
}
```

## 🔐 Authentication & Authorization

- **Public routes**: Không cần authentication
- **Admin routes**: Cần JWT token với role Admin
- Middleware authentication cần được thêm vào các admin routes

## 🎨 Ví dụ sử dụng API

### 1. Lấy thông tin About Us (Public)

```bash
GET http://localhost:3005/about
```

### 2. Tạo/Cập nhật About Us (Admin)

```bash
POST http://localhost:3005/admin/about
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "storeName": "DarkCore Shop",
  "slogan": "Your trusted online store",
  "story": "We started in 2020...",
  "email": "contact@darkcore.com",
  "phone": "0123456789",
  "address": "123 Street, City",
  "mission": "To provide the best products",
  "vision": "Be the leading e-commerce",
  "coreValues": [
    {
      "title": "Quality",
      "description": "We focus on quality",
      "icon": "quality-icon.png"
    }
  ],
  "socialMedia": {
    "facebook": "https://facebook.com/darkcore",
    "instagram": "https://instagram.com/darkcore"
  },
  "stats": {
    "yearsOfOperation": 4,
    "totalCustomers": 10000,
    "totalProducts": 500
  }
}
```

### 3. Lấy danh sách Founders (Public)

```bash
GET http://localhost:3005/founders
```

### 4. Tạo Founder mới (Admin)

```bash
POST http://localhost:3005/admin/founders
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "fullName": "John Doe",
  "position": "CEO & Co-Founder",
  "bio": "John has 10 years of experience...",
  "quote": "Innovation is our passion",
  "email": "john@darkcore.com",
  "avatar": "john-avatar.jpg",
  "socialMedia": {
    "linkedin": "https://linkedin.com/in/johndoe"
  },
  "achievements": [
    {
      "title": "Founded DarkCore",
      "description": "Started the company",
      "year": 2020
    }
  ],
  "sortOrder": 1
}
```

## 📁 Cấu trúc thư mục

```
about-service/
├── src/
│   ├── models/
│   │   ├── AboutModel.js          # Model thông tin cửa hàng
│   │   └── FounderModel.js        # Model thông tin Founders
│   ├── services/
│   │   ├── AboutService.js        # Business logic cho About
│   │   └── FounderService.js      # Business logic cho Founder
│   ├── controller/
│   │   ├── AboutController.js     # Controller cho About
│   │   └── FounderController.js   # Controller cho Founder
│   ├── routes/
│   │   ├── index.js               # Main routes
│   │   ├── AboutRouter.js         # Routes cho About
│   │   └── FounderRouter.js       # Routes cho Founder
│   ├── middleware/                # Auth middleware (cần thêm)
│   ├── config/                    # Configuration files (cần thêm)
│   ├── server.js                  # Entry point
│   └── swagger.js                 # Swagger configuration
├── .env
├── package.json
└── README.md
```

## ⚠️ Lưu ý

1. **Authentication**: Admin routes cần thêm authentication middleware để bảo mật.

2. **Upload Images**: Cần tích hợp Cloudinary hoặc storage service khác để upload ảnh cho logo, avatar, images.

3. **Validation**: Nên thêm middleware validation để kiểm tra dữ liệu đầu vào.

## 🚀 Roadmap

- [ ] Thêm authentication middleware cho admin routes
- [ ] Tích hợp Cloudinary cho upload ảnh
- [ ] Thêm validation middleware
- [ ] Thêm rate limiting
- [ ] Thêm caching với Redis
- [ ] Viết unit tests
- [ ] Thêm CI/CD pipeline
- [ ] Thêm feature Timeline/Milestones (lịch sử phát triển công ty)
- [ ] Thêm feature Team Members (đội ngũ nhân viên)

## 📞 Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ team phát triển.

## 📄 License

ISC
