// Simplified auth middleware for discount service
// This middleware assumes req.user is already populated by API Gateway

// Middleware chỉ cho Admin
const authAdminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Không có dữ liệu người dùng", status: "ERR" });
        }

        // Check if user has admin role
        const roleName = req.user.role_id?.name || req.user.role;
        if (roleName !== "admin") {
            return res.status(403).json({ message: "Truy cập bị từ chối", status: "ERR" });
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: "Lỗi máy chủ nội bộ", status: "ERR" });
    }
};

// Middleware cho phép user truy cập chính họ hoặc admin
const authMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Không có dữ liệu người dùng", status: "ERR" });
        }

        const roleName = req.user.role_id?.name || req.user.role;
        if (roleName === "admin" || req.user._id === req.params.id) {
            return next();
        }

        return res.status(403).json({ message: "Truy cập bị từ chối", status: "ERR" });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi máy chủ nội bộ", status: "ERR" });
    }
};

// Middleware chỉ cần user login (không phân biệt role)
const authUserMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Không có dữ liệu người dùng", status: "ERR" });
    }
    next();
};

module.exports = { authMiddleware, authAdminMiddleware, authUserMiddleware };