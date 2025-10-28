const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Contact = require("../model/ContactModel"); // ✅ Thêm import Contact

// Attach user từ header hoặc Bearer token
const attachUserFromHeader = (req, res, next) => {
  try {
    let user = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
        user._id = new mongoose.Types.ObjectId(user._id || user.userId || user.id);
      } catch {
        user = jwt.decode(token);
        if (user) user._id = new mongoose.Types.ObjectId(user._id || user.userId || user.id);
      }
    }

    if (!user && req.headers["x-user"]) {
      try {
        user = JSON.parse(req.headers["x-user"]);
        if (!user._id && !user.userId)
          return res.status(400).json({ message: "Invalid user header", status: "ERR" });
        user._id = new mongoose.Types.ObjectId(user._id || user.userId);
      } catch {
        return res.status(400).json({ message: "Invalid x-user format", status: "ERR" });
      }
    }

    req.user = user; // null nếu anonymous
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid authentication format", status: "ERR" });
  }
};

// Auth: yêu cầu phải có user
const authUserMiddleware = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "No user data", status: "ERR" });
  }
  next();
};

// Auth: kiểm tra role
const authRoleMiddleware = (allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "No user data", status: "ERR" });
    }

    const role = req.user.role || req.user.role_name;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Access denied: insufficient role", status: "ERR" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", status: "ERR" });
  }
};

// Kiểm tra ownership contact
const checkOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid contact ID", status: "ERR" });
    }

    const contact = await Contact.findById(id);
    if (!contact || contact.isDeleted) {
      return res.status(404).json({ message: "Contact not found", status: "ERR" });
    }

    // Admin có thể xem tất cả, user chỉ xem của mình
    if (req.user.role_name !== "admin" && contact.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You can only access your own contact", status: "ERR" });
    }

    req.contact = contact; // Gắn để controller dùng lại
    next();
  } catch (error) {
    return res.status(500).json({ message: "Error checking ownership", status: "ERR", error: error.message });
  }
};

module.exports = {
  attachUserFromHeader,
  authUserMiddleware,
  authRoleMiddleware,
  checkOwnership,
};
