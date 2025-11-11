const mongoose = require("mongoose");

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

const authAdminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Không có thông tin user", status: "ERR" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Chỉ admin mới được truy cập", status: "ERR" });
    }

    next();
};

const authCustomerMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Không có thông tin user", status: "ERR" });
    }

    if (req.user.role !== "customer") {
        return res.status(403).json({ message: "Chỉ khách hàng mới được truy cập", status: "ERR" });
    }

    next();
};



module.exports = {
    attachUserFromHeader,
    authAdminMiddleware,
    authCustomerMiddleware,
};
