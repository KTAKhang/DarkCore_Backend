const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    console.log('🔍 Payment Service Auth - Headers:', req.headers.authorization ? 'Has token' : 'No token');
    console.log('🔍 Payment Service Auth - Full headers:', JSON.stringify(req.headers));
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ Payment Service Auth - No token provided');
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    console.log('🔍 Payment Service Auth - Token exists, verifying...');
    
    // Sử dụng ACCESS_TOKEN_SECRET giống Auth Service
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
    console.log('🔍 Payment Service Auth - SECRET exists?', !!secret);
    
    if (!secret) {
      console.error('❌ Payment Service Auth - ACCESS_TOKEN_SECRET or JWT_SECRET is missing in .env file!');
      return res.status(500).json({ message: "Server configuration error. Please contact administrator." });
    }
    
    const decoded = jwt.verify(token, secret);
    console.log('✅ Payment Service Auth - Token valid, user:', decoded._id);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Payment Service Auth - JWT verify error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = { authMiddleware };
