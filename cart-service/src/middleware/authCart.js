const mongoose = require("mongoose"); 
// Middleware để gắn thông tin người dùng từ header x-user vào req.user
const attachUserFromHeader = (req, res, next) => {
  try {
    // Ghi log header x-user để debug
    console.log("x-user header:", req.headers["x-user"]);
    // Kiểm tra xem header x-user có tồn tại không
    if (!req.headers["x-user"]) {
      return res
        .status(401)
        .json({ message: "Missing user header", status: "ERR" }); // Trả lỗi 401 nếu thiếu header
    }

    // Parse dữ liệu JSON từ header x-user
    const user = JSON.parse(req.headers["x-user"]);
    // Ghi log dữ liệu user đã parse để debug
    console.log("Parsed user:", user);
    // Kiểm tra xem user có chứa _id hoặc userId không
    if (!user._id && !user.userId) {
      return res
        .status(400)
        .json({
          message: "Invalid user header: missing _id or userId",
          status: "ERR",
        }); // Trả lỗi 400 nếu thiếu _id hoặc userId
    }

    // Chuyển đổi _id hoặc userId thành ObjectId của mongoose
    user._id = new mongoose.Types.ObjectId(user._id || user.userId);
    // Gắn thông tin user vào req để sử dụng trong các middleware/controller tiếp theo
    req.user = user;
    // Chuyển sang middleware tiếp theo
    next();
  } catch (err) {
    // Ghi log lỗi khi parse header x-user
    console.error("Error parsing x-user:", err.message);
    // Trả lỗi 400 nếu format header không hợp lệ
    return res
      .status(400)
      .json({ message: "Invalid user header format", status: "ERR" });
  }
};

// Middleware để kiểm tra xem có thông tin người dùng hợp lệ trong req.user không
const authUserMiddleware = (req, res, next) => {
  // Kiểm tra xem req.user và req.user._id có tồn tại không
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "No user data or invalid userId", status: "ERR" }); // Trả lỗi 401 nếu thiếu thông tin user
  }
  // Chuyển sang middleware tiếp theo nếu hợp lệ
  next();
};

// Middleware để kiểm tra vai trò (role) của người dùng
const authRoleMiddleware = (allowedRoles) => async (req, res, next) => {
  try {
    // Kiểm tra xem req.user và req.user._id có tồn tại không
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "No user data", status: "ERR" }); // Trả lỗi 401 nếu thiếu thông tin user
    }

    // Lấy role từ req.user (hỗ trợ các tên trường khác nhau: role_id, role, role_name)
    const role = req.user.role_id || req.user.role || req.user.role_name;
    // Kiểm tra xem role có nằm trong danh sách allowedRoles không
    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient role", status: "ERR" }); // Trả lỗi 403 nếu role không được phép
    }

    // Chuyển sang middleware tiếp theo nếu role hợp lệ
    next();
  } catch (err) {
    // Trả lỗi 500 nếu xảy ra lỗi trong quá trình xử lý
    return res
      .status(500)
      .json({ message: "Internal server error", status: "ERR" });
  }
};

// Xuất các middleware để sử dụng trong router
module.exports = {
  attachUserFromHeader, // Xuất middleware gắn thông tin user từ header
  authUserMiddleware, // Xuất middleware kiểm tra user hợp lệ
  authRoleMiddleware, // Xuất middleware kiểm tra vai trò
};