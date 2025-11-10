const mongoose = require("mongoose");

const attachUserFromHeader = (req, res, next) => {
    try {
        const userHeader = req.headers["x-user"];
        if (!userHeader) {
            console.error("❌ Repair Service: Missing x-user header");
            return res.status(401).json({ message: "Thiếu thông tin user", status: "ERR" });
        }

        // Decode URL encoded JSON string
        const userDataJson = decodeURIComponent(userHeader);
        const user = JSON.parse(userDataJson);
        console.log("🔍 Repair Service: User from header - role:", user.role, "id:", user._id);

        if (!mongoose.Types.ObjectId.isValid(user._id)) {
            console.error("❌ Repair Service: Invalid user ID:", user._id);
            return res.status(400).json({ message: "User ID không hợp lệ", status: "ERR" });
        }

        if (user.status === false) {
            console.error("❌ Repair Service: User account is locked");
            return res.status(403).json({ message: "Tài khoản đã bị khóa", status: "ERR" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("❌ Repair Service attachUserFromHeader error:", err.message);
        console.error("❌ Header value:", req.headers["x-user"]);
        return res.status(400).json({ message: "Header user không hợp lệ", status: "ERR" });
    }
};

const authUserMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Không có thông tin user", status: "ERR" });
    }
    next();
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

const authAdminOrRepairStaffMiddleware = (req, res, next) => {
    if (!req.user) {
        console.error("❌ Repair Service: No user data in request");
        return res.status(401).json({ message: "Không có thông tin user", status: "ERR" });
    }

    console.log("🔍 Repair Service: Checking role - current role:", req.user.role);
    if (req.user.role !== "admin" && req.user.role !== "repair-staff") {
        console.error("❌ Repair Service: Access denied - role:", req.user.role);
        return res.status(403).json({ 
            message: "Chỉ admin hoặc repair-staff mới được truy cập", 
            status: "ERR",
            userRole: req.user.role 
        });
    }

    next();
};

module.exports = {
    attachUserFromHeader,
    authUserMiddleware,
    authAdminMiddleware,
    authAdminOrRepairStaffMiddleware,
};


