
const ProfileRouter = require("./ProfileRouter");
const CustomerRouter = require("./CustomerRouter");
const routes = (app) => {

    app.use("", ProfileRouter);
    app.use("", CustomerRouter);

};

module.exports = routes;