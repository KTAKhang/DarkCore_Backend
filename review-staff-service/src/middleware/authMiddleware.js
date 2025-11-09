const mongoose = require("mongoose");

const attachUserFromHeader = (req, res, next) => {
    try {
        const userHeader = req.headers["x-user"];
        if (!userHeader) {
            return res.status(401).json({ message: "Thiếu thông tin user", status: "ERR" });
        }

        const user = JSON.parse(userHeader);

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
        return res.status(403).json({ message: "Chỉ nhân viên bán hàn mới được truy cập", status: "ERR" });
    }

    next();
};

module.exports = {
    attachUserFromHeader,
    authAdminMiddleware,
    authCustomerMiddleware,
    authSaleStaffMiddleware,
};
