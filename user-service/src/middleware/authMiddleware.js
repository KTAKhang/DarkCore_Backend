const UserModel = require("../models/UserModel");


// Middleware lấy user từ header do Gateway gửi sang
const attachUserFromHeader = async (req, res, next) => {
    try {
        if (req.headers["x-user"]) {
            const userFromHeader = JSON.parse(req.headers["x-user"]);

            // Luôn lấy user từ DB để đảm bảo thông tin mới nhất
            const user = await UserModel.findById(userFromHeader._id);

            if (!user) {
                return res.status(401).json({ message: "User not found", status: "ERR" });
            }

            // Check status: false = bị block
            if (user.status === false) {
                return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa bởi admin", status: "ERR" });
            }

            // Nếu OK thì gắn user vào req
            req.user = user;
        }

        next();
    } catch (err) {
        console.error("attachUserFromHeader error:", err);
        return res.status(400).json({ message: "Invalid user header", status: "ERR" });
    }
};

// Middleware chỉ cho Admin
const authAdminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "No user data", status: "ERR" });
        }

        const userData = await UserModel.findById(req.user._id).populate("role_id", "name");

        if (!userData || userData.role_id?.name !== "admin") {
            return res.status(403).json({ message: "Access denied", status: "ERR" });
        }

        req.user = userData;
        next();
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", status: "ERR" });
    }
};

// Middleware cho phép user truy cập chính họ hoặc admin
const authMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "No user data", status: "ERR" });
        }

        const userData = await UserModel.findById(req.user._id).populate("role_id", "name");

        if (userData?.role_id?.name === "admin" || req.user._id === req.params.id) {
            req.user = userData;
            return next();
        }

        return res.status(403).json({ message: "Access denied", status: "ERR" });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", status: "ERR" });
    }
};

// Middleware chỉ cần user login (không phân biệt role)
const authUserMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "No user data", status: "ERR" });
    }
    next();
};

module.exports = { authMiddleware, authAdminMiddleware, authUserMiddleware, attachUserFromHeader };
