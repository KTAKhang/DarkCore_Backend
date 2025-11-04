
const OrderRouter = require("./OrderRouter");
const routes = (app) => {
    app.use("", OrderRouter);
};

module.exports = routes;