const ReviewRouter = require("./ReviewRouter");

const routes = (app) => {
    app.use("/api/reviews", ReviewRouter);
};

module.exports = routes;