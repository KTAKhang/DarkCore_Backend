
const ProfileRouter = require("./ProfileRouter");
const CustomerRouter = require("./CustomerRouter");
const ProductReviewRouter = require("./ProductReviewRouter");
const routes = (app) => {

    app.use("", ProfileRouter);
    app.use("", CustomerRouter);
    app.use("", ProductReviewRouter);
};

module.exports = routes;