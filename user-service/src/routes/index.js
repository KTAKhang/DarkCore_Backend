
const ProfileRouter = require("./ProfileRouter");

const routes = (app) => {

    app.use("", ProfileRouter);

};

module.exports = routes;