const mongoose = require("mongoose");

// Middleware để gắn thông tin người dùng từ header x-user vào req.user
// Giữ nguyên tên hàm để tương thích với các route hiện có
const attachUserFromHeader = (req, res, next) => {
  try {
    const userHeader = req.headers["x-user"];

    if (!userHeader) {
      return res.status(401).json({ status: "ERR", code: 401, message: "Thiếu thông tin user trong header x-user" });
    }

    let user;
    try {
      user = typeof userHeader === "string" ? JSON.parse(userHeader) : userHeader;
    } catch (e) {
      console.error("attachUserFromHeader: invalid JSON in x-user header", e.message);
      return res.status(400).json({ status: "ERR", code: 400, message: "Header x-user không hợp lệ (JSON)" });
    }

    // Hỗ trợ cả _id hoặc userId
    const idCandidate = user._id || user.userId;
    if (!idCandidate) {
      return res.status(400).json({ status: "ERR", code: 400, message: "Thiếu _id hoặc userId trong header x-user" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(idCandidate)) {
      return res.status(400).json({ status: "ERR", code: 400, message: "User ID không hợp lệ" });
    }

    // Ensure _id is a string ObjectId
    user._id = idCandidate.toString();

    // Check if account is locked/disabled
    if (user.status === false) {
      return res.status(403).json({ status: "ERR", code: 403, message: "Tài khoản đã bị khóa" });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error("attachUserFromHeader error:", err);
    return res.status(500).json({ status: "ERR", code: 500, message: "Lỗi nội bộ khi xử lý header x-user" });
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