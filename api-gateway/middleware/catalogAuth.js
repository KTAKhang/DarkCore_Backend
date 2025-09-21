import jwt from "jsonwebtoken";

// Middleware cho catalog - optional authentication
export const catalogAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        // Không có token - vẫn cho phép truy cập (public)
        req.user = null;
        return next();
    }

    try {
        // Có token - verify và gán user
        req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
        next();
    } catch (err) {
        // Token không hợp lệ - vẫn cho phép truy cập nhưng không có user info
        req.user = null;
        next();
    }
};

// Middleware cho catalog admin - required authentication
export const catalogAdminAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
        
        // Kiểm tra role admin (nếu cần)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Admin access required" });
        }
        
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
};
