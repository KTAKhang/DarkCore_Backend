const mongoose = require("mongoose");

// Middleware để gắn thông tin người dùng từ header x-user vào req.user
// Giữ nguyên tên hàm để tương thích với các route hiện có
const attachUserFromHeader = (req, res, next) => {
  try {
    const userHeader = req.headers["x-user"];
    if (!userHeader) {
      return res.status(401).json({ message: "Thiếu thông tin user", status: "ERR" });
    }

    // Decode URL encoded JSON string
    const userDataJson = decodeURIComponent(userHeader);
    const user = JSON.parse(userDataJson);

    if (!mongoose.Types.ObjectId.isValid(user._id)) {
      return res.status(400).json({ message: "User ID không hợp lệ", status: "ERR" });
    }

    if (user.status === false) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa", status: "ERR" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("attachUserFromHeader error:", err);
    return res.status(400).json({ message: "Header user không hợp lệ", status: "ERR" });
  }
};

// Middleware để kiểm tra xem có thông tin người dùng hợp lệ trong req.user không


// Middleware để kiểm tra vai trò (role) của người dùng
// allowedRoles: array of role strings
const authRoleMiddleware = (allowedRoles = []) => (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ status: "ERR", code: 401, message: "Không có thông tin user" });
  }

  const role = req.user.role_id || req.user.role || req.user.role_name;
  if (!role) {
    return res.status(403).json({ status: "ERR", code: 403, message: "Không có thông tin role của user" });
  }

  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    // If no roles provided, treat as allowed
    return next();
  }

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ status: "ERR", code: 403, message: "Truy cập bị từ chối: không đủ quyền" });
  }

  return next();
};

// Xuất các middleware để sử dụng trong router
module.exports = {
  attachUserFromHeader,
  authRoleMiddleware,
};