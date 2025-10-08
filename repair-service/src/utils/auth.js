const jwt = require("jsonwebtoken");

const decodeOptional = (req, _res, next) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) {
		req.user = null;
		return next();
	}
	try {s
		req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		return next();
	} catch (_err) {
		req.user = null;
		return next();
	}
};

const requireAuth = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) return res.status(401).json({ error: "Missing token" });
	try {
		req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		return next();
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Token expired" });
		}
		return res.status(403).json({ error: "Invalid token" });
	}
};

const requireAdmin = (req, res, next) => {
	requireAuth(req, res, () => {
		if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required" });
		return next();
	});
};

const requireAdminOrRepairStaff = (req, res, next) => {
	requireAuth(req, res, () => {
		if (req.user?.role === "admin" || req.user?.role === "repair-staff") return next();
		return res.status(403).json({ error: "Admin or repair-staff required" });
	});
};

const requireTechnicianOrAdmin = (req, res, next) => {
	requireAuth(req, res, () => {
		if (req.user?.role === "admin" || req.user?.role === "repair-staff") return next();
		return res.status(403).json({ error: "Technician or admin required" });
	});
};

module.exports = { decodeOptional, requireAuth, requireAdmin, requireAdminOrRepairStaff, requireTechnicianOrAdmin };


