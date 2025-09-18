
const AuthRouter = require("./AuthRouter");
const CategoryRouter = require("./CategoryRouter");
const ProductRouter = require("./ProductRouter");

const routes = (app) => {

    app.use("", AuthRouter);
    app.use("/api", CategoryRouter);
    app.use("/api", ProductRouter);
};

module.exports = routes;