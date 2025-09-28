const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Helper function để refresh token
const refreshToken = async (refreshTokenValue) => {
    try {
        console.log(`🔄 Refresh token - AUTH_SERVICE_URL:`, process.env.AUTH_SERVICE_URL);
        console.log(`🔄 Refresh token - Calling API with refresh token`);
        const response = await axios.post(`${process.env.AUTH_SERVICE_URL}/refresh-token`, {}, {
            headers: {
                'Cookie': `refreshToken=${refreshTokenValue}`
            },
            withCredentials: true
        });
        console.log(`✅ Refresh token - Response:`, response.data);
        return response.data.token.access_token;
    } catch (error) {
        console.error(`❌ Refresh token - Error:`, error.response?.data || error.message);
        throw new Error("Failed to refresh token");
    }
};

// Helper function để lấy refresh token từ cookie
const getRefreshTokenFromCookie = (req) => {
    const cookies = req.headers.cookie;
    if (!cookies) return null;
    
    const refreshTokenMatch = cookies.match(/refreshToken=([^;]+)/);
    return refreshTokenMatch ? refreshTokenMatch[1] : null;
};

// Middleware chỉ cho Admin (decode token trực tiếp từ header)
const authAdminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Missing or invalid token", status: "ERR" });
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        let accessToken = token;
        
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
        } catch (err) {
            // Token hết hạn, thử refresh
            if (err.name === 'TokenExpiredError') {
                const refreshTokenValue = getRefreshTokenFromCookie(req);
                if (refreshTokenValue) {
                    try {
                        accessToken = await refreshToken(refreshTokenValue);
                        decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
                        // Gửi token mới về client
                        res.setHeader('New-Access-Token', accessToken);
                    } catch (refreshErr) {
                        return res.status(403).json({ message: "Token expired and refresh failed", status: "ERR" });
                    }
                } else {
                    return res.status(403).json({ message: "Token expired and no refresh token", status: "ERR" });
                }
            } else {
                return res.status(403).json({ message: "Invalid token", status: "ERR" });
            }
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

// Middleware cho Admin và Sales-staff (decode token trực tiếp từ header)
const authAdminSalesMiddleware = async (req, res, next) => {
    try {
        console.log(`🔍 Auth middleware - Headers:`, req.headers);
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(`❌ Auth middleware - Missing or invalid token`);
            return res.status(401).json({ message: "Missing or invalid token", status: "ERR" });
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        let accessToken = token;
        
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
            console.log(`✅ Auth middleware - Token valid, decoded:`, decoded);
        } catch (err) {
            console.log(`⚠️ Auth middleware - Token error:`, err.name, err.message);
            // Token hết hạn, thử refresh
            if (err.name === 'TokenExpiredError') {
                console.log(`🔄 Auth middleware - Token expired, attempting refresh`);
                const refreshTokenValue = getRefreshTokenFromCookie(req);
                console.log(`🔍 Auth middleware - Refresh token from cookie:`, refreshTokenValue ? 'FOUND' : 'NOT FOUND');
                if (refreshTokenValue) {
                    try {
                        console.log(`🔄 Auth middleware - Calling refresh token API`);
                        accessToken = await refreshToken(refreshTokenValue);
                        console.log(`✅ Auth middleware - Token refreshed successfully`);
                        decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
                        // Gửi token mới về client
                        res.setHeader('New-Access-Token', accessToken);
                    } catch (refreshErr) {
                        console.error(`❌ Auth middleware - Refresh failed:`, refreshErr.message);
                        return res.status(403).json({ message: "Token expired and refresh failed", status: "ERR" });
                    }
                } else {
                    console.log(`❌ Auth middleware - No refresh token found`);
                    return res.status(403).json({ message: "Token expired and no refresh token", status: "ERR" });
                }
            } else {
                console.log(`❌ Auth middleware - Invalid token:`, err.message);
                return res.status(403).json({ message: "Invalid token", status: "ERR" });
            }
        }
        
        const role = (decoded.role || decoded.role_name || '').toString().toLowerCase();
        if (role === 'admin' || role === 'sales-staff' || decoded.isAdmin) {
            req.user = decoded;
            return next();
        }
        return res.status(403).json({ message: "Access denied", status: "ERR" });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", status: "ERR" });
    }
};

// Middleware xử lý token chung (để decode token từ header)
const tokenMiddleware = async (req, res, next) => {
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
            // Token hết hạn, thử refresh
            if (err.name === 'TokenExpiredError') {
                const refreshTokenValue = getRefreshTokenFromCookie(req);
                if (refreshTokenValue) {
                    try {
                        const newAccessToken = await refreshToken(refreshTokenValue);
                        decoded = jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
                        // Gửi token mới về client
                        res.setHeader('New-Access-Token', newAccessToken);
                    } catch (refreshErr) {
                        return res.status(403).json({ message: "Token expired and refresh failed", status: "ERR" });
                    }
                } else {
                    return res.status(403).json({ message: "Token expired and no refresh token", status: "ERR" });
                }
            } else {
                return res.status(403).json({ message: "Invalid token", status: "ERR" });
            }
        }
        
        req.user = decoded;
        next();
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

module.exports = { 
    authMiddleware, 
    authAdminMiddleware, 
    authAdminSalesMiddleware, 
    authStaffMiddleware,
    tokenMiddleware 
};
