
// const CategoryRouter = require("./CategoryRouter");
// const ProductRouter = require("./ProductRouter");
const SalesStatsRouter = require("./SalesStatsRouter");

const routes = (app) => {
    // ❌ Category & Product nên thuộc Catalog Service, không phải Order Service
    // app.use("/", CategoryRouter);
    // app.use("/", ProductRouter);
    
    // ✅ Sales Stats Service chỉ xử lý thống kê
    app.use("/", SalesStatsRouter);
};

module.exports = routes;