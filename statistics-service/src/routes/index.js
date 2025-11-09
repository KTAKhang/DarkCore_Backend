const StatisticsRouter = require("./StatisticsRouter");

const routes = (app) => {
    app.use("/api/statistics", StatisticsRouter);
};

module.exports = routes;

