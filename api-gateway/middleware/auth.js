import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const gatewayAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(400).json({
            status: "ERR",
            code: 400,
            message: "Thiếu access token trong header Authorization",
        });
    }

    try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
        const response = await axios.post(
            `${authServiceUrl}/verify-token`,
            { access_token: token },
            { timeout: 5000 }
        );
        const result = response.data;
        if (result.status !== "OK") {
            return res.status(result.code || 403).json({
                status: result.status,
                code: result.code,
                message: result.message,
            });
        }
        // Encode JSON string with URL encoding to avoid invalid characters in HTTP header
        const userDataJson = JSON.stringify(result.data);
        req.headers["x-user"] = encodeURIComponent(userDataJson);
        next();

    } catch (error) {
        console.error("AuthService verify failed:", error.message);

        if (error.response) {
            const errData = error.response.data;
            return res.status(errData.code || error.response.status || 500).json({
                status: errData.status || "ERR",
                code: errData.code || 500,
                message: errData.message || "Xác thực thất bại từ AuthService",
            });
        } else if (error.request) {
            return res.status(503).json({
                status: "ERR",
                code: 503,
                message: "Không thể kết nối tới AuthService",
            });
        } else {
            return res.status(500).json({
                status: "ERR",
                code: 500,
                message: "Lỗi nội bộ trong Gateway khi xác thực",
            });
        }
    }
};

// ✅ THÊM MIDDLEWARE MỚI: Conditional Auth - chỉ auth cho admin routes
export const gatewayAuthConditional = async (req, res, next) => {
    // Nếu route không có /admin (public route), skip auth
    if (!req.path.includes("/admin")) {
        return next();
    }

    // Route có /admin - yêu cầu auth
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(400).json({
            status: "ERR",
            code: 400,
            message: "Thiếu access token trong header Authorization",
        });
    }

    try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
        const response = await axios.post(
            `${authServiceUrl}/verify-token`,
            { access_token: token },
            { timeout: 5000 }
        );
        const result = response.data;
        if (result.status !== "OK") {
            return res.status(result.code || 403).json({
                status: result.status,
                code: result.code,
                message: result.message,
            });
        }
        const userDataJson = JSON.stringify(result.data);
        req.headers["x-user"] = encodeURIComponent(userDataJson);
        next();
    } catch (error) {
        console.error("AuthService verify failed:", error.message);
        if (error.response) {
            const errData = error.response.data;
            return res.status(errData.code || error.response.status || 500).json({
                status: errData.status || "ERR",
                code: errData.code || 500,
                message: errData.message || "Xác thực thất bại từ AuthService",
            });
        } else if (error.request) {
            return res.status(503).json({
                status: "ERR",
                code: 503,
                message: "Không thể kết nối tới AuthService",
            });
        } else {
            return res.status(500).json({
                status: "ERR",
                code: 500,
                message: "Lỗi nội bộ trong Gateway khi xác thực",
            });
        }
    }
};