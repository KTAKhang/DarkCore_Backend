const mongoose = require("mongoose");
const attachUserFromHeader = (req, res, next) => {
    try {
        const userHeader = req.headers["x-user"];
        if (!userHeader) {
            return res.status(401).json({ message: "Thiếu thông tin user", status: "ERR" });
        }
        let parsedUser = null;
        if (typeof userHeader === "string") {
            const trimmed = userHeader.trim();
            if (!trimmed) {
                return res.status(401).json({ message: "Thiếu thông tin user", status: "ERR" });
            }
            try {
                const decoded = trimmed.startsWith("%") ? decodeURIComponent(trimmed) : trimmed;
                parsedUser = JSON.parse(decoded);
            } catch (decodeErr) {
                console.error("attachUserFromHeader decode error:", decodeErr);
                return res.status(400).json({ message: "Header user không hợp lệ", status: "ERR" });
            }
        } else if (typeof userHeader === "object") {
            parsedUser = userHeader;
        } else {
            return res.status(400).json({ message: "Header user không hợp lệ", status: "ERR" });
        }
        const user = parsedUser;
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
const authSaleStaffMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Không có thông tin user", status: "ERR" });
    }
    if (req.user.role !== "sales-staff") {
        return res.status(403).json({ message: "Chỉ nhân viên bán hàng mới được truy cập", status: "ERR" });
    }
    next();
};

// Middleware mới: Cho phép cả admin và customer
const authAdminOrCustomerMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Không có thông tin user", status: "ERR" });
    }
    if (req.user.role !== "admin" && req.user.role !== "customer") {
        return res.status(403).json({ message: "Chỉ admin hoặc khách hàng mới được truy cập", status: "ERR" });
    }
    next();
};

module.exports = {
    attachUserFromHeader,
    authAdminMiddleware,
    authCustomerMiddleware,
    authSaleStaffMiddleware,
    authAdminOrCustomerMiddleware, // Export middleware mới
};