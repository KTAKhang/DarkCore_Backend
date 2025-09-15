import jwt from "jsonwebtoken";

export const gatewayAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
};
