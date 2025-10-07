const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const UserModel = require("../models/UserModel");

dotenv.config();

// Middleware xác thực JWT cơ bản (verify token và lưu vào req.user)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({
            status: "ERR",
            message: "Token không được cung cấp. Vui lòng đăng nhập",
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                status: "ERR",
                message: "Token không hợp lệ hoặc đã hết hạn",
            });
        }

        // Lưu thông tin user từ token vào req để sử dụng trong middleware tiếp theo
        req.user = {
            _id: decoded._id || decoded.id,
            role: decoded.role,
            isAdmin: decoded.isAdmin,
        };

        next();
    });
};

// Middleware chỉ cần user login (không phân biệt role) - dùng cho Favorite
const authUserMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            status: "ERR",
            message: "Token không được cung cấp. Vui lòng đăng nhập",
        });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                status: "ERR",
                message: "Token không hợp lệ hoặc đã hết hạn",
            });
        }

        req.user = {
            id: decoded._id || decoded.id,
            _id: decoded._id || decoded.id, // Để tương thích với cả 2 format
            role: decoded.role,
            isAdmin: decoded.isAdmin,
        };

        next();
    });
};

// Middleware chỉ cho Admin (query database để kiểm tra role)
const authAdminMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: "ERR",
                message: "Token không được cung cấp. Vui lòng đăng nhập",
            });
        }

        // Verify token trước
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: "ERR",
                    message: "Token không hợp lệ hoặc đã hết hạn",
                });
            }

            // Query database để lấy thông tin user đầy đủ
            const userData = await UserModel.findById(decoded._id || decoded.id).populate(
                "role_id",
                "name"
            );

            if (!userData || userData.role_id?.name !== "admin") {
                return res.status(403).json({
                    status: "ERR",
                    message: "Bạn không có quyền truy cập. Chỉ admin mới có thể thực hiện thao tác này",
                });
            }

            req.user = userData;
            next();
        });
    } catch (err) {
        return res.status(500).json({
            status: "ERR",
            message: "Internal server error",
        });
    }
};

// Middleware cho phép user truy cập chính họ hoặc admin
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: "ERR",
                message: "Token không được cung cấp. Vui lòng đăng nhập",
            });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: "ERR",
                    message: "Token không hợp lệ hoặc đã hết hạn",
                });
            }

            const userData = await UserModel.findById(decoded._id || decoded.id).populate(
                "role_id",
                "name"
            );

            if (!userData) {
                return res.status(404).json({
                    status: "ERR",
                    message: "Không tìm thấy user",
                });
            }

            // Cho phép admin hoặc chính user đó
            if (
                userData.role_id?.name === "admin" ||
                (decoded._id || decoded.id) === req.params.id
            ) {
                req.user = userData;
                return next();
            }

            return res.status(403).json({
                status: "ERR",
                message: "Bạn không có quyền truy cập",
            });
        });
    } catch (err) {
        return res.status(500).json({
            status: "ERR",
            message: "Internal server error",
        });
    }
};

module.exports = {
    verifyToken,
    authUserMiddleware,
    authAdminMiddleware,
    authMiddleware,
};

