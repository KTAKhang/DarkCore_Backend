import jwt from "jsonwebtoken";

export const gatewayAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // Gửi sang User Service qua header
        req.headers["x-user"] = JSON.stringify(decoded);
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(403).json({ error: "Invalid token" });
    }
};
