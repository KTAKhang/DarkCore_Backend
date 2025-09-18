const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel"); 
// Nếu Cart service KHÔNG có UserModel thì phải gọi API auth-service thay vì import model trực tiếp

// Giải JWT từ header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided", status: "ERR" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
    if (err) {
      console.error("JWT Verify Error:", err);
      return res.status(403).json({ message: "Invalid or expired token", status: "ERR" });
    }
    console.log("Decoded token:", decoded); // log payload ra để debug
    req.user = decoded;
    next();
  });
};




// Chỉ cần user login
const authUserCart = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized", status: "ERR" });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(403).json({ message: "User not found", status: "ERR" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", status: "ERR" });
  }
};

// Chỉ admin mới thao tác
const authAdminCart = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized", status: "ERR" });
    }

    const user = await UserModel.findById(req.user._id).populate("role_id", "name");
    if (!user || user.role_id?.name !== "admin") {
      return res.status(403).json({ message: "Access denied", status: "ERR" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", status: "ERR" });
  }
};

module.exports = { verifyToken, authUserCart, authAdminCart };
