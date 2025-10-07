
// const CategoryRouter = require("./CategoryRouter");
// const ProductRouter = require("./ProductRouter");
const OrderRouter = require("./OrderRouter");

const routes = (app) => {
    // ❌ Category & Product nên thuộc Catalog Service, không phải Order Service
    // app.use("/", CategoryRouter);
    // app.use("/", ProductRouter);
    
    // ✅ Order Service chỉ xử lý Orders
    app.use("/", OrderRouter);
};

module.exports = routes;