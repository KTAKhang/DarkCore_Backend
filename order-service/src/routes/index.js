
const CategoryRouter = require("./CategoryRouter");
const ProductRouter = require("./ProductRouter");
const OrderRouter = require("./OrderRouter");

const routes = (app) => {
    app.use("/api", CategoryRouter);
    app.use("/api", ProductRouter);
    app.use("/api", OrderRouter);
};

module.exports = routes;