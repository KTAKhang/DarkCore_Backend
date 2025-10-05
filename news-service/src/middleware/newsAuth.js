const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // ← THÊM: Để decode token

const attachUserFromHeader = (req, res, next) => {
  try {
    let user = null;

    // ƯU TIÊN 1: Decode từ Authorization Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        console.log("Decoding token..."); // Log debug
        user = jwt.verify(token, process.env.JWT_SECRET); // Verify trước (an toàn)
        console.log("Decoded user from token:", user);
        user._id = new mongoose.Types.ObjectId(
          user._id || user.userId || user.id
        );
      } catch (jwtErr) {
        console.error("JWT verify error:", jwtErr.message);
        // Fallback decode không verify (chỉ cho public, không dùng cho protected)
        user = jwt.decode(token);
        if (user) {
          user._id = new mongoose.Types.ObjectId(
            user._id || user.userId || user.id
          );
          console.log("Decoded user (no verify):", user);
        }
      }
    }

    // FALLBACK: Nếu không có token, dùng x-user header (tương thích cũ)
    if (!user && req.headers["x-user"]) {
      console.log("x-user header:", req.headers["x-user"]);
      try {
        // Thêm try riêng cho JSON.parse
        user = JSON.parse(req.headers["x-user"]);
        console.log("Parsed user from x-user:", user);
        if (!user._id && !user.userId) {
          return res.status(400).json({
            message: "Invalid user header: missing _id or userId",
            status: "ERR",
          });
        }
        user._id = new mongoose.Types.ObjectId(user._id || user.userId);
      } catch (parseErr) {
        console.error("x-user parse error:", parseErr.message);
        return res
          .status(400)
          .json({ message: "Invalid x-user format", status: "ERR" });
      }
    }

    // KHÔNG BẮT BUỘC: Chỉ set req.user nếu có, else undefined (cho public)
    req.user = user; // Có thể null/undefined nếu anonymous
    next(); // Luôn next(), protected routes sẽ check sau
  } catch (err) {
    console.error("Error in attachUserFromHeader:", err.message);
    return res
      .status(400)
      .json({ message: "Invalid authentication format", status: "ERR" });
  }
};

const authUserMiddleware = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({ message: "No user data or invalid userId", status: "ERR" });
  }
  next();
};

const authRoleMiddleware = (allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "No user data", status: "ERR" });
    }

    const role = req.user.role_id || req.user.role || req.user.role_name; // Linh hoạt lấy role
    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient role", status: "ERR" });
    }

    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error", status: "ERR" });
  }
};

module.exports = {
  attachUserFromHeader,
  authUserMiddleware,
  authRoleMiddleware,
};
