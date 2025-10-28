// ============================================
// 📦 ABOUT SERVICE ROUTES
// ============================================
// About Service chỉ xử lý thông tin About Us và Founders

const AboutRouter = require("./AboutRouter");
const FounderRouter = require("./FounderRouter");

const routes = (app) => {
    // About Service routes - Thông tin cửa hàng
    app.use("/", AboutRouter);
    
    // Founder routes - Thông tin CEO/Founders
    app.use("/", FounderRouter);
};

module.exports = routes;