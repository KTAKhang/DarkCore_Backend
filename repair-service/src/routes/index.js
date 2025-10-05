const RepairServiceRouter = require("./RepairServiceRouter");
const RepairRequestRouter = require("./RepairRequestRouter");

const routes = (app) => {
	app.use("/api", RepairServiceRouter);
	app.use("/api", RepairRequestRouter);
};

module.exports = routes;


