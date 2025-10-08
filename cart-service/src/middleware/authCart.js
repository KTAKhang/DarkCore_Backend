const mongoose = require("mongoose");

const attachUserFromHeader = (req, res, next) => {
  try {
    console.log("x-user header:", req.headers["x-user"]);
    if (!req.headers["x-user"]) {
      return res
        .status(401)
        .json({ message: "Missing user header", status: "ERR" });
    }

    const user = JSON.parse(req.headers["x-user"]);
    console.log("Parsed user:", user);
    if (!user._id && !user.userId) {
      return res
        .status(400)
        .json({
          message: "Invalid user header: missing _id or userId",
          status: "ERR",
        });
    }

    user._id = new mongoose.Types.ObjectId(user._id || user.userId);
    req.user = user;
    next();
  } catch (err) {
    console.error("Error parsing x-user:", err.message);
    return res
      .status(400)
      .json({ message: "Invalid user header format", status: "ERR" });
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

    const role = req.user.role_id || req.user.role || req.user.role_name;
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
