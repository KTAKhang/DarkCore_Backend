
const ProductReviewRouter = require("./ProductReviewRouter");
const routes = (app) => {
    app.use("", ProductReviewRouter);
};

module.exports = routes;