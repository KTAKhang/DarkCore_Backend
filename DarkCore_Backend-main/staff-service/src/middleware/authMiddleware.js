const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");

// Middleware chỉ cho Admin (decode token trực tiếp từ header)
const authAdminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Missing or invalid token", status: "ERR" });
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
        } catch (err) {
            return res.status(403).json({ message: "Invalid token", status: "ERR" });
        }
        const role = (decoded.role || decoded.role_name || '').toString().toLowerCase();
        if (role === 'admin' || decoded.isAdmin) {
            req.user = decoded;
            return next();
        }
        return res.status(403).json({ message: "Access denied", status: "ERR" });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", status: "ERR" });
    }
};

// Middleware cho phép staff truy cập chính họ hoặc admin
const authMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "No user data", status: "ERR" });
        }

        const staffData = await UserModel.findById(req.user._id).populate("role_id", "name");

        if (staffData?.role_id?.name === "admin" || req.user._id === req.params.id) {
            req.user = staffData;
            return next();
        }

        return res.status(403).json({ message: "Access denied", status: "ERR" });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", status: "ERR" });
    }
};

// Middleware chỉ cần staff login (không phân biệt role)
const authStaffMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "No user data", status: "ERR" });
    }
    next();
};

module.exports = { authMiddleware, authAdminMiddleware, authStaffMiddleware };
